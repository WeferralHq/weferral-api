let Conversion = require('../models/conversion');
let Participant = require('../models/participant');
let Campaign = require('../models/campaign');
//let Reward = require('../models/reward');
let Commission = require('../models/commission');
let Customer = require('../models/customer');
let campaignCron = require('../config/campaign-cron');

module.exports = function(router) {

    /*let getUserId = Customer.findOne('unique_id', uniqueId, function(result){
        return result.data.id;
    });*/

    router.get('/conversions/:campaign_id', function(req, res) {
        let campaign_id = req.params.campaign_id;
        Conversion.findAll('campaign_id', campaign_id, function(conversions){
            if(conversions && conversions.length > 0){
                res.json(conversions);
            }
        })
    });

    require("./entity")(router, Conversion, "conversions");

    return router;
}