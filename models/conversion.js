let Campaign = require('./campaign');
let Participant = require('./participant');
let Reward = require('./reward');
let references = [
    {"model": Campaign, "referenceField": "campaign_id", "direction": "to", "readOnly": true},
    {"model": Participant, "referenceField": "participant_id", "direction": "to", "readOnly": true},
    {"model": Reward, "referenceField": "reward_id", "direction": "to", "readOnly": true}
];
let Conversion = require("./base/entity")("conversions", references);

module.exports = Conversion;