let async = require("async");
let customer = require('../models/customer');
let conversion = require('../models/conversion');
let click = require('../models/clicks');
let reward = require('../models/reward');

module.exports = {
    getPtAnalyticsData: (part) => {
        return new Promise(async (resolve, reject) => {
            let customers = (await customer.find({"participant_id": part.data.id}));
            let clicks = (await  click.find({"participant_id": part.data.id}));
            let conversions = (await conversion.find({"participant_id": part.data.id}));
            let rewards = (await reward.find({"participant_id": part.data.id}));
            async.parallel({
                participantStats: function (callback) {
                    let stats = {};
                    stats.totalsignups = stats.totalcustomers = stats.totalclicks = stats.awaitingpayout = 0;
                    if (conversions !== undefined) { stats.totalsignups = conversions.length }
                    if (customers !== undefined) { stats.totalcustomers = customers.length }
                    if (clicks !== undefined) { stats.totalclicks = clicks.length }
                    if (rewards !== undefined) {
                        rewards.map(reward => {
                            stats.awaitingpayout += reward.data.assignedCredit;
                        })
                    }
                    callback(null,stats);
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