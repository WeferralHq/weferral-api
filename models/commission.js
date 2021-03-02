let Campaign = require('./campaign');
let Referral = require('./referral');
let Conversion = require('./conversion');
//let Customer = require('./customer');
let references = [
    {"model": Campaign, "referenceField": "campaign_id", "direction": "to", "readOnly": true},
    {"model": Referral, "referenceField": "participant_id", "direction": "to", "readOnly": true},
    {"model": Conversion, "referenceField": "conversion_id", "direction": "to", "readOnly": true}
    //{"model": Customer, "referenceField": "customer_id", "direction": "to", "readOnly": true}
];
let Reward = require('./reward');
let Commission = require("./base/entity")("commissions", references);
let moment = require('moment');
let notification = require('../lib/notification');

let lastDay = function(){
    let tday = new Date()
    , lastOfMonth = new Date(tday.getFullYear(), tday.getMonth()+1, 0)
    , dayOfWeek = lastOfMonth.getDay();

    return dayOfWeek;
}

let dateScheduledFor = function(payout_term){
    let date = new Date();
    let dt = date.getDate();
    if(payout_term === 'NET15'){
        date.setDate(15);
        if(dt >= 15) {
            date.setMonth(date.getMonth() + 2);
        }

        return date;
    } else if(payout_term === 'NET20'){
        date.setDate(20);
        if(dt >= 20) {
            date.setMonth(date.getMonth() + 2);
        }

        return date;
    } else {
        date.setDate(lastDay());
        if(dt >= lastDay()) {
            date.setMonth(date.getMonth() + 2);
        }

        return date;
    }
}


let CreateCommission = function(campaign, callback) {
    let self = this;
    //let totalAmount = 0;
    //Commission.findAll('cam')
    let campaignId = campaign.data.id;
    

    self.create( function (result){  
        new Promise(function (resolve, reject) {
            Commission.getSumOfColumnFiltered('amount', 'campaign_id', campaignId, function(tAmt){
                return resolve(tAmt);
            })
        }).then(function(totalAmount){
            return new Promise(function (resolve, reject) {
                let total = parseInt(totalAmount);
                if (total >= campaign.data.minimum_cash_payout) {
                    Reward.findOne('participant_id', self.data.participant_id, async function (reward) {
                        if (reward.data) {
                            //let newCredit = reward.data.assignedCredit + self.data.amount;
                            reward.data.assignedCredit = total;
                            await reward.update();
                            return resolve(result);
                        } else {
                            let newReward = new Reward({
                                'assignedCredit': total,
                                'currency': self.data.currency || 'usd',
                                'type': campaign.data.reward_type,
                                'campaign_id': campaignId,
                                'participant_id': self.data.participant_id,
                                'dateScheduledFor': dateScheduledFor(campaign.data.payout_terms)
                            });

                            newReward.create(function (new_reward) {
                                return resolve(new_reward);
                                //callback(result);
                            });
                        }
                    })
                }
            })
        }).then(function () {
            callback(null, result);
        }).catch(function (err) {
            callback(err, null);
        });

    })
};

Commission.prototype.CreateCommission = new Proxy(CreateCommission, {
    apply: function (target, thisArg, argList) {
        if (argList.length === 2) {
            target.bind(thisArg)(...argList)
        } else {
            target.bind(thisArg)(undefined, ...argList);
        }
    }
});


module.exports = Commission;