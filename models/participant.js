let Campaign = require('./campaign');
let references = [
    {"model": Campaign, "referenceField": "campaign_id", "direction": "to", "readOnly": true}
];
let Participant = require('./base/entity')("participants", references);

let randomStr = function (len, str){
    let ans = '';
    for (var i = len; i > 0; i--) {
        ans +=
            str[Math.floor(Math.random() * str.length)];
    }
    return ans; 
}

Participant.prototype.createParticipant = function (callback){
    let self = this;
    self.data.email = self.data.email.toLowerCase();
    let name = self.data.email.substring(0, self.data.email.lastIndexOf("@"));
    let domain = self.data.email.substring(self.data.email.lastIndexOf("@") +1);
    self.data.referral_code = randomStr(10,name + domain);

    self.create(function (err, created_participant) {
        console.log(`Created participant: ${created_participant}`);
        callback(err, created_participant);
    });
};

Participant.prototype.deleteParticipant = function (callback) {
    let self = this;
    new Promise(function (resolve, reject) {
        self.delete(function (err, deleted_user) {
            if (err) {
                return reject({'message':'Participant cannot be deleted, must be suspended. Participant has connected records!'});
            }
            return resolve({'message':`Participant ${self.data.id} has been deleted from database!`, deleted_user});
        });
    }).then(function (result) {
        callback(null, result);
    }).catch(function (err) {
        callback(err, null);
    });
};

Participant.prototype.suspend = async function (callback) {
    let self = this;
    console.log('Participant status: ', self.data.status);
    if (self.data.status !== 'invited' && self.data.status !== 'suspended') {
        self.data.status = "suspended";
        let updatedParticipant = await self.update();
        callback(updatedParticipant);
    }
    else {
        throw 'Participant can not be invited or already suspended'
    }
};

Participant.prototype.approve = async function (callback) {
    let self = this;
    console.log('Participant status: ', self.data.status);
    if (self.data.status !== 'invited') {
        self.data.status = "active";
        let updatedParticipant = await self.update();
        callback(updatedParticipant);
    }
    else {
        throw 'Participant can not be approved'
    }
};

Participant.prototype.disapprove = async function (callback) {
    let self = this;
    console.log('Participant status: ', self.data.status);
    if (self.data.status !== 'invited') {
        self.data.status = "inactive";
        let updatedParticipant = await self.update();
        callback(updatedParticipant);
    }
    else {
        throw 'Participant can not be disapprove'
    }
};

module.exports = Participant;