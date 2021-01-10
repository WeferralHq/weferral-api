let async = require("async");
let customer = require('../models/customer');
let participant = require('../models/participant');
let commission = require('../models/commission');
let campaign = require('../models/campaign');
let reward = require('../models/reward');

module.exports = {
    getAnalyticsData: () => {
        return new Promise(async (resolve, reject) => {
            let participants = (await participant.find());
            let rewards = (await reward.find());
            async.parallel({
                participantStats: function (callback) {
                    let stats = {};
                    stats.total = participants.length;
                    stats.active = stats.invited = stats.flagged = stats.fundsTotal = 0;
                    participants.map(participant => {
                        if(participant.data.status === 'active') { stats.active++; }
                        else if(participant.data.status === 'invited') { stats.invited++; }
                        else if(participant.data.status === 'flagged') { stats.flagged++; }
                    });
                    callback(null,stats);
                },
                awaitingPayouts: function (callback) {
                    reward.getSumOfColumnFiltered('assignedCredit', null, null, function (awaitingPayouts) {
                        let total = (awaitingPayouts == null ? 0 : awaitingPayouts);
                        callback(null, total);
                    });
                },
                redeemedCredits: function (callback) {
                    reward.getSumOfColumnFiltered('redeemedCredit', null, null, function (redeemedCredits) {
                        let total = (redeemedCredits == null ? 0 : redeemedCredits);
                        callback(null, total);
                    });
                },
            }, function (err, results) {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                console.log(results);
                resolve(results);
            });
        })
    }
}