let Click = require('../models/click');
let Customer = require('../models/customer');
let Campaign = require('../models/campaign');
let Participant = require('../models/participant');
let validate = require('./middlewares/validate');

let getUniqueCustId = function(){
    let random_code = Math.random().toString(36).substring(10, 12) + Math.random().toString(36).substring(10, 12);

    Customer.findOne('unique_id', random_code, function(result){
        if(result && result.length > 0){
            getUniqueCustId();
        }
    });

    return random_code;
}

module.exports = function(router) {

    router.get('/clicks/:campaign_id', function(req, res) {
        let campaign_id = req.params.campaign_id;
        Click.findAll('campaign_id', campaign_id, function(clicks){
            if(clicks && clicks.length > 0){
                res.json(clicks);
            }
        })
    });

    require("./entity")(router, Click, "clicks");

    return router;
}