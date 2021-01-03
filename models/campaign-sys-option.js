
let CampaignSystemOption = require("./base/entity")("campaign_system_options");

CampaignSystemOption.prototype.getOptions = function(campaignId){
    return new Promise((resolve, reject) => {
        CampaignSystemOption.findAll('campaign_id', campaignId, (result) => {
            resolve(result.reduce((settings, setting)=>{
                settings[setting.data.option] = setting.data.value;
                return settings;
            }, {}))
        })
    })
}


module.exports = CampaignSystemOption;