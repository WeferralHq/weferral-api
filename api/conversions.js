let Conversion = require('../models/conversion');
let Participant = require('../models/participant');
let Campaign = require('../models/campaign');
//let Reward = require('../models/reward');
let Commission = require('../models/commission');
let Customer = require('../models/customer');

module.exports = function(router) {

    /*let getUserId = Customer.findOne('unique_id', uniqueId, function(result){
        return result.data.id;
    });*/

    router.post('/conversion/:referral_code/events', async function(req, res){
        let referral_code = req.params.referral_code;
        let uniqueId = req.body.userId;
        let customer = (await Customer.find({"unique_id": uniqueId}))[0];
        Participant.findOne('referral_code', referral_code, function (rows){
            Campaign.findById(rows.data.campaign_id, function(campaign){
                let rewardType = campaign.data.reward_type;
                let newCommission = new Commission({
                    'campaign_id': campaign.data.id,
                    'participant_id': rows.data.id,
                    'customer_id': customer.data.id,
                    'commission_type': campaign.data.commission_type, 
                    'currency': campaign.data.currency,
                    'conversion_amount': req.body.amount
                });
                let rewardPrice = campaign.data.reward_price;
                if(rewardType === 'cash_reward'){
                    newCommission.set('amount', rewardPrice);
                    newCommission.CreateCommission(campaign, function(created_comm){
                        return res.status(200).json({'message': 'Successful'});
                    })
                }else if(rewardType === 'discount'){
                    let perc = ((rewardPrice / 100) * req.body.amount).toFixed(3);
                    newCommission.set('amount', perc);
                    newCommission.CreateCommission(campaign, function(created_comm){
                        return res.status(200).json(created_comm);
                    })
                } else {
                    newCommission.create(function(created_comm){
                        return res.status(200).json(created_comm);
                    })
                }
            })
        })
    });

    require("./entity")(router, Conversion, "conversions");

    return router;
}