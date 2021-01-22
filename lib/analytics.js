let async = require("async");
let customer = require('../models/customer');
let participant = require('../models/participant');
let commission = require('../models/commission');
let campaign = require('../models/campaign');
let conversion = require('../models/conversion');
let click = require('../models/click');
let reward = require('../models/reward');

module.exports = {
    getAnalyticsData: () => {
        return new Promise(async (resolve, reject) => {
            let participants = (await participant.find());
            let customers = (await customer.find());
            let clicks = (await  click.find());
            let conversions = (await conversion.find());
            let rewards = (await reward.find());
            async.parallel({
                participantStats: function (callback) {
                    let stats = {};
                    stats.total_participants = participants.length;
                    stats.total_conversions = conversions.length;
                    stats.active = stats.invited = stats.flagged = 0;
                    participants.map(participant => {
                        if(participant.data.status === 'active') { stats.active++; }
                        else if(participant.data.status === 'invited') { stats.invited++; }
                        else if(participant.data.status === 'flagged') { stats.flagged++; }
                    });
                    callback(null,stats);
                },
                customerStats:function (callback) {
                    let stats = {};
                    stats.total_customers = customers.length;
                    stats.paying_customers = stats.flagged_customers = 0;
                    customers.map(customer => {
                        if(customer.data.status === 'flagged') { stats.flagged_customers++; }
                        conversion.findAll('customer_id', customer.data.id, function(convResults){
                            if(convResults && convResults.length > 0){
                                convResults.map(conv => { stats.paying_customers++; })
                            }
                        })
                    })
                    callback(null,stats);
                },
                clickStats:function (callback) {
                    let stats = {};
                    stats.total_clicks = clicks.length;
                    callback(null,stats);
                },
                totalRevenue: function (callback) {
                    conversion.getSumOfColumnFiltered('amount', null, null, function (totalRevenue) {
                        let total = (totalRevenue == null ? 0 : totalRevenue);
                        callback(null, total);
                    });
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

    /*getCampaignData: (id) => {
        return new Promise(async (resolve, reject) => {
            let clicks = (await  click.find({"campaign_id": id}))[0];
            let conversions = (await conversion.find({"campaign_id": id}))[0];
            async.parallel({
                clickStats: function (callback) {
                    let stats = {};
                }
            }, function (err, results) {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                console.log(results);
                resolve(results);
            });
        });
    }*/
}