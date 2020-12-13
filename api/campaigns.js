let Campaign = require("../models/campaign");
let validate = require("./middlewares/validate");

module.exports = function(router) {
    router.post('/campaigns/:id/republish', validate(Campaign), function(req, res, next) {
        let campaign_object = res.locals.valid_object;
        if(!campaign_object.publish) {
            let updatedCampaign = campaign_object.republish();
            return res.json(updatedCampaign);
        }
    });

    router.post('/campaigns/:id/unpublish', validate(Campaign), function(req, res, next) {
        let campaign_object = res.locals.valid_object;
        if(campaign_object.publish) {
            let updatedCampaign = campaign_object.unpublish();
            return res.json(updatedCampaign);
        }
    });

    router.post("/campaign", function (req, res, next) {
        req.body.user_id = req.user.get("id");

        Campaign.findAll("name", req.body.name, (campaigns) => {
            if (campaigns && campaigns.length > 0) {
                return res.status(400).json({error: "Campaign name already in use"});
            }
        });

        let newCampaign = new Campaign(req.body);
        newCampaign.set("publish", true);
        newCampaign.createCampaign(function (err, result) {
            if (err) {
                return res.status(403).json({error: err});
            } else {
                res.locals.json = result.data;
                res.locals.valid_object = result;
                return res.status(200).json(result);
                //next();
            }
        });
    });

    require("./entity")(router, Campaign, "campaigns");

    return router;
};