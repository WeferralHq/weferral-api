let Campaign = require('./campaign');
let Participant = require('./participant');
let Customer = require('./customer');
let references = [
    {"model": Campaign, "referenceField": "campaign_id", "direction": "to", "readOnly": true},
    {"model": Participant, "referenceField": "participant_id", "direction": "to", "readOnly": true},
    {"model": Customer, "referenceField": "customer_id", "direction": "to", "readOnly": true}
];
let Reward = require("./base/entity")("rewards", references);

let CheckRedemption = function(){}

Reward.prototype.CreateReward = async function() {
    let self = this;

    self.create(function (result){

    })
}


module.exports = Reward;