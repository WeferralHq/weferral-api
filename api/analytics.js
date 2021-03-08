
let analytics = require("../lib/analytics");
//let validate = require('../middleware/validate');
let auth = require('./middlewares/auth');

module.exports = function(router) {
    router.get(`/analytics/data`, auth(), async function(req, res, next){
        res.json(await analytics.getAnalyticsData());
        /*analytics.getAnalyticsData(function(data){
            res.json(data);
        });*/
    });

    router.get(`/check/env`, function(req, res, next){
        let config = process.env;
        if(config.POSTGRES_DB_USER || config.SMTP_HOST){
            res.json({'env': true});
        }
    });

    return router;
};