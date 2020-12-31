let Campaign = require('./campaign');
let Participant = require('./participant');
let Conversion = require('./conversion');
let references = [
    {"model": Campaign, "referenceField": "campaign_id", "direction": "to", "readOnly": true},
    {"model": Participant, "referenceField": "participant_id", "direction": "to", "readOnly": true},
    {"model": Conversion, "referenceField": "conversion_id", "direction": "to", "readOnly": true}
];
let Reward = require('./reward');
let Commission = require("./base/entity")("commissions", references);

let totalRewardAmount = function(id, callback) {
    Commission.getSumOfColumnFiltered('amount', 'id', id, function(totalRewardAmount) {
        let total = (totalRewardAmount == null ? 0 : totalRewardAmount);
        callback(null, total);
    });
}

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
            date.setMonth(date.getMonth() + 1);
        }

        return date;
    } else if(payout_term === 'NET20'){
        date.setDate(20);
        if(dt >= 20) {
            date.setMonth(date.getMonth() + 1);
        }

        return date;
    } else {
        date.setDate(lastDay());
        if(dt >= lastDay()) {
            date.setMonth(date.getMonth() + 1);
        }

        return date;
    }
}


Commission.prototype.CreateCommission = async function() {
    let self = this;

    self.create(function (result){
        let campaignId = campaign.data.id;
        let totalAmount = totalRewardAmount(campaignId);
        if(totalAmount !== null && totalAmount >= campaign.data.minimum_cash_payout){
            Reward.findOne('campaign_id', campaignId, function(reward){
                if(reward.data && reward.data.length > 0){
                    let newCredit = reward.data.assignedCredit + self.data.amount;
                    reward.data.assignedCredit = newCredit;
                    await reward.update();
                } else {
                    let newReward = new Reward({
                        'assignedCredit': self.data.amount,
                        'dateScheduledFor': dateScheduledFor(campaign.data.payout_terms)
                    });

                    newReward.create(function(new_reward, callback){
                        callback(new_reward);
                    });
                }
            })
        }

    })
}


module.exports = Commission;