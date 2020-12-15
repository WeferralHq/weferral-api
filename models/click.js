let Campaign = require('./campaign');
let Participant = require('./participant');
let references = [
    {"model": Campaign, "referenceField": "role_id", "direction": "to", "readOnly": true},
    {"model": Participant, "referenceField": "role_id", "direction": "to", "readOnly": true}
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


Click.prototype.createClick = async function () {
    let self = this;
    let result = {};
    
    self.data.metadata.clickTime = new Date().toISOString();  
    self.data.metadata.location = getLocationMetadata(self.data.metadata.ip);

    result = await Url.findOne('shortned_url', url);
    await self.create();
    return result;
};

module.exports = Click;