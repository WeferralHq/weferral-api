var CampaignSystemOption = require("../models/campaign-sys-option");
//the default system options
let create_systemOptions = async function (campaign_id) {
    let systemOptions =
    {
        options : [
            {
                "option": "button_default_color",
                "value": "#FFFFFF",
                public: true,
                "campaign_id": campaign_id,
                "type": "theme",
                "data_type": "color_picker"
            },
            {
                "option": "button_default_hover_color",
                "value": "#EEEEEE",
                public: true,
                "campaign_id": campaign_id,
                "type": "theme",
                "data_type": "color_picker"
            },
            {
                "option": "button_default_text_color",
                "value": "#000000",
                public: true,
                "campaign_id": campaign_id,
                "type": "theme",
                "data_type": "color_picker"
            },
            {"option": "button_info_color", "value": "#03A9F4", public: true,"campaign_id": campaign_id, "type": "theme", "data_type": "color_picker"},
            {
                "option": "button_info_hover_color",
                "value": "#039BE5",
                public: true,
                "campaign_id": campaign_id,
                "type": "theme",
                "data_type": "color_picker"
            },
            {
                "option": "button_info_text_color",
                "value": "#ffffff",
                public: true,
                "campaign_id": campaign_id,
                "type": "theme",
                "data_type": "color_picker"
            },
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
            {"option": "page_link_color", "value": "#30468a", public: true, "campaign_id": campaign_id, "type": "theme", "data_type": "color_picker"},
            {"option": "header_text_color", "value": "#30468a", public: true, "campaign_id": campaign_id, "type": "theme", "data_type": "color_picker"},
            {"option": "text_size", "value": "12", public: true, "campaign_id": campaign_id, "type": "theme", "data_type": "number"},
            {"option": "allow_registration", "value": "true", public: true, "campaign_id": campaign_id, "type": "system", "data_type": "bool"},
            {"option": "allow_company_registration", "value": "true", public: true, "campaign_id": campaign_id, "type": "system", "data_type": "bool"},
            {"option": "allow_address_registration", "value": "true", public: true, "campaign_id": campaign_id, "type": "system", "data_type": "bool"},
            {"option": "primary_theme_text_color", "value": "#FFFFFF", public: true, "campaign_id": campaign_id, "type": "theme", "data_type": "color_picker"},
            {"option": "primary_theme_background_color", "value": "#000000", public: true, "campaign_id": campaign_id, "type": "theme", "data_type": "color_picker"},
            {"option": "breadcrumb_color", "value": "#FFFFFF", public: true, "campaign_id": campaign_id, "type": "theme", "data_type": "color_picker"},
            {"option": "featured_service_show_all_button_text", "value": "Show All", public: true, "campaign_id": campaign_id, "campaign_id": campaign_id, "type": "featured services", "data_type": "text"},
            {"option": "featured_service_section_background_color", "value": "#FFFFFF", public: true, "campaign_id": campaign_id, "type": "featured services", "data_type": "color_picker"},
    
        ]
    };
    CampaignSystemOption.batchCreate(systemOptions.options, function (err, result) {
        if(!err){
            return result;
        }
    });
};

module.exports =  create_systemOptions;