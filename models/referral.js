let User = require('./user');
let references = [
    {"model": User, "referenceField": "role_id", "direction": "to", "readOnly": true}
];
let Referral = require('./base/entity')("referrals", references);
let md5 = require('md5');

Referral.prototype.createReferral = async function (){
    let self = this;
    self.data.email = self.data.email.toLowerCase();
    let name = self.data.email.substring(0, email.lastIndexOf("@"));
    let domain = self.data.email.substring(email.lastIndexOf("@") +1);
    self.data.referral_code = md5(name + domain);

    self.create(async function (err, created_referral) {
        console.log(`Created referral: ${created_referral}`);
        callback(err, created_referral);
    });
}

module.exports = Referral;