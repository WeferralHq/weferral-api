let Campaign = require("../models/campaign");
let validate = require("./middlewares/validate");
let Url = require("../models/url");
let auth = require("./middlewares/auth");

module.exports = function(router) {
    router.post('/campaigns/:id/republish', auth(), validate(Campaign), function(req, res, next) {
        let campaign_object = res.locals.valid_object;
        if(!campaign_object.publish) {
            let updatedCampaign = campaign_object.republish();
            return res.json(updatedCampaign);
        }
    });

    router.get('/campaigns', auth(), function (req, res, next) {
        Campaign.findAll(true, true, (campaigns) => {
            if (campaigns && campaigns.length > 0) {
                let camps = (campaigns.map(entity => entity.data));
                return res.status(200).json(camps);
            }
        });
    });

    router.get("/campaign/:id(\\d+)", auth(), validate(Campaign), function (req, res, next) {
        let campaign = res.locals.valid_object;
        campaign.attachReferences(updatedParent => {
            res.status(200).json(updatedParent);
        });
    });

    router.put("/campaign/url/:id/:Smedia", auth(), function(req, res, next){
        let campaign_id = req.params.id;
        let social_share = req.params.Smedia;
        Url.findOne('campaign_id', campaign_id, async function(result){
            let count = result.data[social_share] + 1;
            result.set(social_share, count);
            let newCount = await result.update();
            res.json(newCount);
        })
    })

    router.post('/campaign-page/:id', auth(), function(req, res, next){
        let id = req.params.id;

        Campaign.findById(id, async function (result) {
            result.set('description', req.body.description);
            let UpdatedCampaign = await result.update();
            return res.status(200).json({'message': 'Successfully Updated'});
        })
    })

    router.post('/campaigns/:id/unpublish', auth(), validate(Campaign), function(req, res, next) {
        let campaign_object = res.locals.valid_object;
        if(campaign_object.publish) {
            let updatedCampaign = campaign_object.unpublish();
            return res.json(updatedCampaign);
        }
    });

    router.post("/campaign", auth(), function (req, res, next) {
        //req.body.user_id = req.user.get("id");
        req.body.name = req.body.name.toLowerCase();

        Campaign.findAll("name", req.body.name, (campaigns) => {
            if (campaigns && campaigns.length > 0) {
                return res.status(400).json({error: "Campaign name already in use"});
            }
        });

        let newCampaign = new Campaign(req.body);
        newCampaign.set("published", true);
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

    router.post("/campaign/:id/delete", auth(), function (req, res, next) {
        let id = req.params.id;

        Campaign.findById(id,  function (delCamp) {
            delCamp.deleteCampaign(function (err, result) {
                if (err) {
                    return res.status(403).json({error: err});
                } else {
                    return res.status(200).json(result);
                    //next();
                }
            })
        })
    })

    router.delete('/campaign/:id', function(req, res){})
    require("./entity")(router, Campaign, "campaigns");

    return router;
};