let Campaign = require('./campaign');
let references = [
    {"model": Campaign, "referenceField": "campaign_id", "direction": "to", "readOnly": true}
];
let Participant = require('./base/entity')("participants", references);
let Conversion = require('./conversion');
let Customers = require('./customer');
let Clicks = require('./click');
let Reward = require('./reward');

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

Participant.prototype.participantStats = async function (){
    let self = this;
    let stats = {};
    let part_id = self.data.id;
    stats.totalsignups = stats.totalcustomers = stats.totalclicks = stats.awaitingpayout = 0;
    let conversions = (await Conversion.find({"participant_id": part_id}))[0];
    let customers = (await Customers.find({"participant_id": part_id}))[0];
    let clicks = (await Clicks.find({"participant_id": part_id}))[0];
    let rewards = (await Reward.find({"participant_id": part_id}))[0];
    if(conversions !== undefined){ stats.totalsignups = conversions.length }
    if(customers !== undefined){ stats.totalcustomers = customers.length }
    if(clicks !== undefined){ stats.totalclicks = clicks.length }
    if(rewards !== undefined){
        rewards.map(reward => {
            stats.awaitingpayout += reward.data.assignedCredit;
        })
    }
    return stats;
}

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

module.exports = Participant;