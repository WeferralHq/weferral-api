let User = require('./user');
let references = [
    {"model": User, "referenceField": "role_id", "direction": "to", "readOnly": true}
];
let Participant = require('./base/entity')("participants", references);
let md5 = require('md5');

Participant.prototype.createParticipant = function (callback){
    let self = this;
    self.data.email = self.data.email.toLowerCase();
    let name = self.data.email.substring(0, self.data.email.lastIndexOf("@"));
    let domain = self.data.email.substring(self.data.email.lastIndexOf("@") +1);
    self.data.referral_code = md5(name + domain);

    self.create(function (err, created_participant) {
        console.log(`Created participant: ${created_participant}`);
        callback(err, created_participant);
    });
}

module.exports = Participant;