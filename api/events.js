let Click = require('../models/click');
let Customer = require('../models/customer');
let Campaign = require('../models/campaign');
let Participant = require('../models/participant');
//let Reward = require('../models/reward');
let Commission = require('../models/commission');
let campaignCron = require('../config/campaign-cron');
let verifyAuth = require('./middlewares/verifyAuth');
let webhook = require('../lib/webhook');

/*let getUniqueCustId = function(){
    let random_code = Math.random().toString(36).substring(10, 12) + Math.random().toString(36).substring(10, 12);

    Customer.findOne('unique_id', random_code, function(result){
        if(result && result.length > 0){
            getUniqueCustId();
        }
    });

    return random_code;
}*/

module.exports = function(router) {

    router.get('/click/:referral_code', verifyAuth(), function(req, res) {
        let referral_code = req.params.referral_code;
        Participant.findOne('referral_code', referral_code, function (rows){
            if (rows.data) {
                if(rows.data.status === 'active') {
                    let campaign_id = rows.data.campaign_id;
                    let participant_id = rows.data.participant_id;
                    let newClick = new Click({
                        'campaign_id': campaign_id,
                        'participant_id': participant_id
                    });
                    newClick.set('ip', req.connection.remoteAddress);
                    newClick.set('customer_id', result.data.id);
                    newClick.createClick(function (err, result) {
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
                let rewardType = campaign.data.reward_type;
                let commissionType = campaign.data.commission_type;
                let newCommission = new Commission({
                    'campaign_id': campaign.data.id,
                    'participant_id': rows.data.id,
                    'customer_id': customer.data.id,
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
                            await webhook('new_commission', created_comm);
                        })
                    }else if(rewardType === 'cash_reward' && commissionType === 'percentage_sale'){
                        let perc = ((rewardPrice / 100) * req.body.amount).toFixed(3);
                        newCommission.set('amount', perc);
                        newCommission.CreateCommission(campaign, async function(created_comm){
                            res.status(200).json({'message': 'Successful'});
                            await webhook('new_commission', created_comm);
                        })
                    } else {
                        newCommission.create(async function(created_comm){
                            res.status(200).json(created_comm);
                            await webhook('new_commission', created_comm);
                        })
                    }
                }
                
            })
        })
    });

    router.post('/events/customer/:referral_code', verifyAuth(), async function(req, res){
        let referral_code = req.params.referral_code;
        let uniqueId = req.body.customer_id;
        let columnName = ['name', 'email'];
        let custData = req.body.meta_data;
        let metaObj = {};
        let customer = (await Customer.find({"customer_id": uniqueId}))[0];
        let participant = (await Participant.find({"referral_code": referral_code}))[0];
        if(participant.data && participant.data.status === 'active'){
            if(!customer.data.id){
                Object.keys(custData).forEach((key, index) => {
                    if (columnName.indexOf(key) < 0) {
                        metaObj = {key: custData[key]}
                    }
                });
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
                        await webhook('new_customer', result);
                    }else{
                        res.status(401).json('Not found');
                    }
                })
            }
        }
    });

    return router;
}