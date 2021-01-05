let CampaignSystemOption = require('../models/campaign-sys-option');
let Campaign = require("../models/campaign");

module.exports = function(router) {

    router.get(`/campaign-system-options/:campaignId`, function (req, res, next) {
        let campaignId = req.params.campaignId;
        CampaignSystemOption.findAll("campaign_id", campaignId, function (results) {
            res.json(results.reduce((acc, entity) => {
                acc[entity.data.option] = entity.data;
                return acc;
            }, {}));
        });
    });

    router.get('/system-setting/:campaignName', function (req, res, next) {
        let campaignName = req.params.campaignName.replace(/-/g, ' ');
        let campaignId = 0;
        Campaign.findOne("name", campaignName, function (campaigns) {
            if (campaigns.data) {
                campaignId = campaigns.data.id;

                CampaignSystemOption.findAll("campaign_id", campaignId, function (results) {
                    res.json(results.reduce((acc, entity) => {
                        acc[entity.data.option] = entity.data;
                        return acc;
                    }, {}));
                });
            }
        });

        
    })

    router.put('/system-settings/:campaignId', function (req, res, next) {
        let campaignId = req.params.campaignId;
        let updateData = req.body;
        CampaignSystemOption.findAll("campaign_id", campaignId, function (options) {
            let filteredUpdates = updateData.filter((option) => {
                return options.some((publicOption) => option.option == publicOption.get("option"));
            })

            CampaignSystemOption.batchUpdate(filteredUpdates, function (result) {
                let updated = result.reduce((settings, setting)=>{
                    console.log(setting);
                    settings[setting[0].option] = setting[0].value;
                    return settings;
                }, {});
                //dispatchEvent("system_options_updated", updated);
                //EventLogs.logEvent(req.user.get('id'), `system-options were updated by user ${req.user.get('email')}`);
                res.status(200).json(result);
            })
        });
    });

    require("./entity")(router, CampaignSystemOption, "campaign-system-options");
};