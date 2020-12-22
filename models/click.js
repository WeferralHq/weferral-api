let Campaign = require('./campaign');
let Participant = require('./participant');
let Customer = require('./customer');
let references = [
    {"model": Campaign, "referenceField": "campaign_id", "direction": "to", "readOnly": true},
    {"model": Participant, "referenceField": "participant_id", "direction": "to", "readOnly": true},
    {"model": Customer, "referenceField": "customer_id", "direction": "to", "readOnly": true}
];
let Click = require('./base/entity')("clicks", references);
let geoip = require('geoip-lite');
let Url = require('./url');

let getLocationMetadata = function (ip){
    let onlyNumberAndDots = /[\d.]+$/
    let ipMetadata = geoip.lookup(ip.match(onlyNumberAndDots)[0])
    console.log(ipMetadata)
    return ipMetadata
}


let createClick = function (options, callback) {
    let self = this;
    
    //self.data.metadata.clickTime = new Date().toISOString();  
    self.data.location = getLocationMetadata(self.data.ip);

    //result = await Url.findOne('shortned_url', url);
    self.create(function (err, result){
        //if(!err){
            callback(err, result);
        //}
    })
};

Click.prototype.createClick = new Proxy(createClick, {
    apply: function (target, thisArg, argList) {
        if (argList.length === 2) {
            target.bind(thisArg)(...argList)
        } else {
            target.bind(thisArg)(undefined, ...argList);
        }
    }
});

module.exports = Click;