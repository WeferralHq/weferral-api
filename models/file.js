let Campaign = require('./campaign');
let references = [
    {"model": Campaign, "referenceField": "campaign_id", "direction": "to", "readOnly": true}
];
let File = require("./base/entity")("files", references);

module.exports = File;