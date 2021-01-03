var CampaignSystemOption = require("../models/campaign-sys-option");
//the default system options
let create_systemOptions = async function (campaign_id) {
    let systemOptions =
    {
        options : [
            {
                "option": "button_primary_color",
                "value": "#2979FF",
                public: true,
                "campaign_id": campaign_id,
                "type": "theme",
                "data_type": "color_picker"
            },
            {
                "option": "button_primary_hover_color",
                "value": "#448AFF",
                public: true,
                "campaign_id": campaign_id,
                "type": "theme",
                "data_type": "color_picker"
            },
            {
                "option": "button_primary_text_color",
                "value": "#ffffff",
                public: true,
                "campaign_id": campaign_id,
                "type": "theme",
                "data_type": "color_picker"
            },
            {"option": "background_color", "value": "#ffffff", public: true, "campaign_id": campaign_id, "type": "theme", "data_type": "color_picker"},
            {"option": "header_text_color", "value": "#30468a", public: true, "campaign_id": campaign_id, "type": "theme", "data_type": "color_picker"},
            {"option": "text_size", "value": "12", public: true, "campaign_id": campaign_id, "type": "theme", "data_type": "number"},
            {"option": "allow_registration", "value": "true", public: true, "campaign_id": campaign_id, "type": "system", "data_type": "bool"},
            {"option": "allow_company_registration", "value": "true", public: true, "campaign_id": campaign_id, "type": "system", "data_type": "bool"},
            {"option": "allow_address_registration", "value": "true", public: true, "campaign_id": campaign_id, "type": "system", "data_type": "bool"},
            {
                "option": "campaign_title_description", 
                "value": "Sign up to become our affiliate and earn rewards. After sign up, you will get access to your custom referral link and your own dashboard", 
                public: true,
                "campaign_id": campaign_id,
                "type": "featured campaign",
                "data_type": "text"
            },
            {"option": "campaign_title_form", "value": "Welcome to our referral program", public: true, "campaign_id": campaign_id, "type": "featured campaign", "data_type": "text"},
            {"option": "google_analytics", public: true, "campaign_id": campaign_id, "type": "system", "data_type": "text"},
    
        ]
    };
    CampaignSystemOption.batchCreate(systemOptions.options, function (err, result) {
        if(!err){
            return result;
        }
    });
};

module.exports =  create_systemOptions;