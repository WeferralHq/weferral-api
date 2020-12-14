let User = require('./user');
let references = [
    {"model": User, "referenceField": "role_id", "direction": "to", "readOnly": true}
];
let Referral = require('./base/entity')("referrals", references);
let md5 = require('md5');

Referral.prototype.createReferral = async function (){
    let self = this;
    self.data.email = self.data.email.toLowerCase();
    var name = self.data.email.substring(0, email.lastIndexOf("@"));
    var domain = self.data.email.substring(email.lastIndexOf("@") +1);
    var hashCode = md5(name + domain);
}

module.exports = Referral;