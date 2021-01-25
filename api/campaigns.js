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

    router.get('/campaigns', function (req, res, next) {
        Campaign.findAll(true, true, (campaigns) => {
            if (campaigns && campaigns.length > 0) {
                let camps = (campaigns.map(entity => entity.data));
                return res.status(200).json(camps);
            }
        });
    });

    router.get("/campaign/:id", function (req, res, next) {
        let id = req.params.id;

        Campaign.findById(id,  function (result) {
            result.attachReferences(updatedParent => {
                res.status(200).json(updatedParent);
            })
        })
    });

    router.post('/campaign-page/:id', function(req, res, next){
        let id = req.params.id;

        Campaign.findById(id, async function (result) {
            result.set('description', req.body.description);
            let UpdatedCampaign = await result.update();
            return res.status(200).json({'message': 'Successfully Updated'});
        })
    })

    router.post('/campaigns/:id/unpublish', validate(Campaign), function(req, res, next) {
        let campaign_object = res.locals.valid_object;
        if(campaign_object.publish) {
            let updatedCampaign = campaign_object.unpublish();
            return res.json(updatedCampaign);
        }
    });

    router.post("/campaign", function (req, res, next) {
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

    router.post("/campaign/:id/delete", function (req, res, next) {
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