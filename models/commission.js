let Campaign = require('./campaign');
let Participant = require('./participant');
let Customer = require('./customer');
let references = [
    {"model": Campaign, "referenceField": "campaign_id", "direction": "to", "readOnly": true},
    {"model": Participant, "referenceField": "participant_id", "direction": "to", "readOnly": true},
    {"model": Customer, "referenceField": "customer_id", "direction": "to", "readOnly": true}
];
let Commission = require("./base/entity")("commissions", references);