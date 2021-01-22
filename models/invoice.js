let InvoiceLines = require("./invoice-line");
let references = [
    {"model": InvoiceLines, "referenceField": "invoice_id", "direction":"from"},
];
let Invoice = require("./base/entity")("invoices", references);
let Campaign = require("./campaign");
let Reward = require("./reward");
let moment = require('moment');

Invoice.fetchInvoices = function (campaign_object) {
    return new Promise(function (resolve, reject) {
        Invoice.findAll('campaign_id', campaign_object.get('id'), function (all_invoice_result) {
            return resolve(all_invoice_result);
        });
    }).then(function (all_invoices) {
        return new Promise(function (resolve, reject) {
            if(all_invoices.length > 0){
                return resolve(all_invoices);
            }else {
                Reward.findAll('campaign_id', campaign_object.get('id'), function(result){})
            }
        });
    })
}