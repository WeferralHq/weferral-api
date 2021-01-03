let CampaignSystemOption = require('../models/campaign-sys-option');

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

    require("./entity")(router, CampaignSystemOption, "campaign-system-options");
};