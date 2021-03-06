let Campaign = require('./campaign');
let Participant = require('./participant');
let Commission = require('./commission');
let references = [
    {"model": Campaign, "referenceField": "campaign_id", "direction": "to", "readOnly": true},
    {"model": Participant, "referenceField": "participant_id", "direction": "to", "readOnly": true},
    {"model": Commission, "referenceField": "customer_id", "direction": "from", "readOnly": true}
];
let Customer = require("./base/entity")("customers", references);

let createCustomer = function (options, callback) {
    let self = this;
    Customer.findAll('customer_id', self.data.customer_id, function(result) {
        if(result.data){
            callback(result);
        }else {
            self.create(function (err, customer) {
                callback(err, customer);
            });
        }
    })
};

Customer.prototype.createCustomer = new Proxy(createCustomer, {
    apply: function (target, thisArg, argList) {
        if (argList.length === 2) {
            target.bind(thisArg)(...argList)
        } else {
            target.bind(thisArg)(undefined, ...argList);
        }
    }
});


module.exports = Customer;