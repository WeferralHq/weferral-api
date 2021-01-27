let Reward = require('./reward');
let references = [
    {"model": Reward, "referenceField": "reward_id", "direction": "to", "readOnly": true}
];
let Redemption = require("./base/entity")("redemptions", references);

module.exports = Redemption;