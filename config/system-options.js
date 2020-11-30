var SystemOption = require("../models/system-options");
//the default system options
let systemOptions =
{
    options : [
        {
            "option": "button_default_color",
            "value": "#FFFFFF",
            public: true,
            "type": "theme",
            "data_type": "color_picker"
        },
        {
            "option": "button_default_hover_color",
            "value": "#EEEEEE",
            public: true,
            "type": "theme",
            "data_type": "color_picker"
        },
        {
            "option": "button_default_text_color",
            "value": "#000000",
            public: true,
            "type": "theme",
            "data_type": "color_picker"
        },
        {"option": "button_info_color", "value": "#03A9F4", public: true, "type": "theme", "data_type": "color_picker"},
        {
            "option": "button_info_hover_color",
            "value": "#039BE5",
            public: true,
            "type": "theme",
            "data_type": "color_picker"
        },
        {
            "option": "button_info_text_color",
            "value": "#ffffff",
            public: true,
            "type": "theme",
            "data_type": "color_picker"
        },
        {
            "option": "button_primary_color",
            "value": "#2979FF",
            public: true,
            "type": "theme",
            "data_type": "color_picker"
        },
        {
            "option": "button_primary_hover_color",
            "value": "#448AFF",
            public: true,
            "type": "theme",
            "data_type": "color_picker"
        },
        {
            "option": "button_primary_text_color",
            "value": "#ffffff",
            public: true,
            "type": "theme",
            "data_type": "color_picker"
        },
        {"option": "background_color", "value": "#ffffff", public: true, "type": "theme", "data_type": "color_picker"},
        {"option": "page_link_color", "value": "#30468a", public: true, "type": "theme", "data_type": "color_picker"},
        {"option": "header_text_color", "value": "#30468a", public: true, "type": "theme", "data_type": "color_picker"},
        {"option": "text_size", "value": "12", public: true, "type": "theme", "data_type": "number"},
        {"option": "allow_registration", "value": "true", public: true, "type": "system", "data_type": "bool"},
        {"option": "company_name", public: true, "type": "system", "data_type": "text"},
        {"option": "company_address", public: true, "type": "system", "data_type": "text"},
        {"option": "company_phone_number", public: true, "type": "system", "data_type": "text"},
        {"option": "company_email", public: true, "type": "system", "data_type": "text"},
        {"option": "hostname", public: true, "type": "system", "data_type": "text"},
        {"option": "primary_theme_text_color", "value": "#FFFFFF", public: true, "type": "theme", "data_type": "color_picker"},
        {"option": "primary_theme_background_color", "value": "#000000", public: true, "type": "theme", "data_type": "color_picker"},
        {"option": "home_featured_description", "value": "Start Selling Your Services Now!", public: true, "type": "content", "data_type": "text"},
        {"option": "home_featured_heading", "value": "Welcome To ServiceBot!", public: true, "type": "content", "data_type": "text"},
        {"option": "breadcrumb_color", "value": "#FFFFFF", public: true, "type": "theme", "data_type": "color_picker"},
        {"option": "featured_service_show_all_button_text", "value": "Show All", public: true, "type": "featured services", "data_type": "text"},
        {"option": "featured_service_section_background_color", "value": "#FFFFFF", public: true, "type": "featured services", "data_type": "color_picker"},

    ],
        populateOptions: function(options=systemOptions.options){
            return Promise.all(options.map((option) => {
                return new Promise((resolve, reject) => {
                    new SystemOption(option).create((err, result) => {
                        if(err){
                            if(err.code == 23505) {
                                resolve(`option ${option.option} already exists`);
                            }else{
                                reject(err);
                            }
                        }else{
                            resolve(`option ${option.option} was created`)
                        }
                    })
                })
            }))
        }
};

module.exports =  systemOptions;