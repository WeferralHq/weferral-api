var SystemOption = require("../models/system-options");
var pjson = require('../package.json');
//the default system options
let systemOptions =
{
    options : [
        {
            "option": "app_version",
            "value": pjson.version,
            public: false,
            "type": "system",
            "data_type": "system"
        },
        {"option": "allow_registration", "value": "true", public: true, "type": "system", "data_type": "bool"},
        {"option": "company_name", public: true, "type": "system", "data_type": "text"},
        {"option": "company_address", public: true, "type": "system", "data_type": "text"},
        {"option": "company_phone_number", public: true, "type": "system", "data_type": "text"},
        {"option": "company_email", public: true, "type": "system", "data_type": "text"},
        {"option": "hostname", public: true, "type": "system", "data_type": "text"},

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