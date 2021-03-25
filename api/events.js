let Click = require('../models/clicks');
let Customer = require('../models/customer');
let Campaign = require('../models/campaign');
let Participant = require('../models/participant');
//let Reward = require('../models/reward');
let Commission = require('../models/commission');
let campaignCron = require('../config/campaign-cron');
let verifyAuth = require('./middlewares/verifyAuth');
let webhook = require('../lib/webhook');
let notification = require('../lib/notification');
let geoip = require('geoip-lite');
var express = require('express');

let getLocationMetadata = function (ip){
    let onlyNumberAndDots = /[\d.]+$/
    let ipMetadata = geoip.lookup(ip.match(onlyNumberAndDots)[0])
    console.log(ipMetadata)
    return ipMetadata
}

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Credentials", true);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
    });
    var router = express.Router();
    app.use("/api/v1", router);

    router.get('/click/:referral_code', verifyAuth(), function(req, res) {
        let referral_code = req.params.referral_code;
        Participant.findOne('referral_code', referral_code, function (rows){
            if (rows.data) {
                if(rows.data.status === 'active') {
                    let campaign_id = rows.data.campaign_id;
                    let participant_id = rows.data.id;
                    let newClick = new Click({
                        'campaign_id': campaign_id,
                        'participant_id': participant_id
                    });
                    newClick.set('ip', req.connection.remoteAddress);
                    newClick.set('location', getLocationMetadata(req.connection.remoteAddress));
                    newClick.create(function (err, result) {
                        Campaign.findById(campaign_id, function (campaign) {
                            if (!campaign.data) {
                                return res.status(401).json('Not found');
                            }
                            return res.status(200).json({ 'cookie_life': campaign.data.cookie_life });
                        })
                    })
                }
            } else {
                return res.status(401).json('Not found');
            }
        });
    });

    router.post('/events/conversion/:referral_code', verifyAuth(), async function(req, res){
        let referral_code = req.params.referral_code;
        let uniqueId = req.body.customer_id;
        let customer = (await Customer.find({"customer_id": uniqueId}))[0];
        Participant.findOne('referral_code', referral_code, function (rows){
            Campaign.findById(rows.data.campaign_id, function(campaign){
                let cust = function(){
                    let id = 0;
                    if(!customer){
                        let newCust = new Customer({
                            'customer_id': uniqueId,
                            'campaign_id': campaign.data.id,
                            'participant_id': rows.data.id,
                            'ip': req.connection.remoteAddress
                        });
                        newCust.createCustomer(async function (err, result) {
                            if (!err) {
                                id = result.data.id;
                            }
                        })
                    }else{
                        id = customer.data.id;
                    }
                    return id;
                }
                let rewardType = campaign.data.reward_type;
                let commissionType = campaign.data.commission_type;
                let newCommission = new Commission({
                    'campaign_id': campaign.data.id,
                    'participant_id': rows.data.id,
                    'customer_id': cust,
                    'commission_type': commissionType, 
                    'currency': campaign.data.currency,
                    'conversion_amount': req.body.amount
                });
                let rewardPrice = campaign.data.reward_price;
                if(campaign.data.enable_recurring){
                    campaignCron(campaign, req.body.amount, newCommission);
                }else {
                    if(rewardType === 'cash_reward' && commissionType === 'fixed'){
                        newCommission.set('amount', rewardPrice);
                        newCommission.CreateCommission(campaign, async function(created_comm){
                            res.status(200).json({'message': 'Successful'});
                            await notification("referral_new_sale_generated", campaign.data.id, rows, rows);
                            await notification("admin_new_sale", campaign.data.id, rows, req.user);
                            await webhook('new_commission', created_comm, campaign.data.id);
                        })
                    }else if(rewardType === 'cash_reward' && commissionType === 'percentage_sale'){
                        let perc = ((rewardPrice / 100) * req.body.amount).toFixed(3);
                        newCommission.set('amount', perc);
                        newCommission.CreateCommission(campaign, async function(created_comm){
                            res.status(200).json({'message': 'Successful'});
                            await notification("referral_new_sale_generated", campaign.data.id, rows, rows);
                            await notification("admin_new_sale", campaign.data.id, rows, req.user);
                            await webhook('new_commission', created_comm, campaign.data.id);
                        })
                    } else {
                        newCommission.create(async function(created_comm){
                            res.status(200).json(created_comm);
                            await notification("referral_new_sale_generated", campaign.data.id, rows, rows);
                            await notification("admin_new_sale", campaign.data.id, rows, req.user);
                            await webhook('new_commission', created_comm, campaign.data.id);
                        })
                    }
                }
                
            })
        })
    });

    router.post('/events/customer/:referral_code', verifyAuth(), async function(req, res){
        let referral_code = req.params.referral_code;
        let uniqueId = req.body.customer_id;
        let columnName = ['name', 'email', 'customer_id'];
        let customer = (await Customer.find({"customer_id": uniqueId}))[0];
        let participant = (await Participant.find({"referral_code": referral_code}))[0];
        if(participant.data && participant.data.status === 'active'){
            if(!customer){
                let metaArr = []
                Object.keys(req.body).forEach((key, index) => {
                    if (columnName.indexOf(key) < 0) {
                        metaArr.push({[key]: req.body[key]});
                    }
                });
                let metaObj = Object.assign({}, ...metaArr.map(function(item){
                    let key = Object.keys(item);
                    return ({[key]: item[key]});
                }));
                console.log(metaObj);
                let newCust = new Customer({
                    'customer_id': uniqueId,
                    'campaign_id': participant.data.campaign_id,
                    'participant_id': participant.data.id,
                    'name': req.body.name,
                    'email': req.body.email,
                    'ip': req.connection.remoteAddress,
                    'metadata': metaObj
                })
                newCust.createCustomer(async function (err, result) {
                    if (!err) {
                        res.json({'message': 'Customer successfully created'});
                        await webhook('new_customer', result, participant.data.campaign_id);
                    }else{
                        res.status(401).json('Not found');
                    }
                })
            }
        }
    });

    return router;
}