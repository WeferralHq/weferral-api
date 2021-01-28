let Campaign = require('./campaign');
let Participant = require('./participant');
let Referral = require('./referral');
let references = [
    {"model": Referral, "referenceField": "participant_id", "direction": "to", "readOnly": true},
    {"model": Campaign, "referenceField": "campaign_id", "direction": "to", "readOnly": true}
];
let Reward = require("./base/entity")("rewards", references);

Reward.prototype.CreateReward = async function() {
    let self = this;

    self.create(function (result){

    })
}


module.exports = Reward;