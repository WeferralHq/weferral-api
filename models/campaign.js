let User = require('./user');
let references = [
    {"model": User, "referenceField": "role_id", "direction": "to", "readOnly": true}
];
let Campaign = require('./base/entity')("campaigns", references);
let Url = require('./url');
let default_notifications = require('../config/default-notifications');
let create_systemOptions = require('../config/campaign-sys-options');
let NotificationTemplate = require('./notification-template');
//let async = require("async");

let createCampaign = function (options, callback) {
    let self = this;
    
    //Use the Entity create to create the campaign
    self.create(async function (err, created_campaign) {
        console.log(`Create Campaign: ${created_campaign}`);
        let campN = created_campaign.data;
        await default_notifications(campN.id);
        await create_systemOptions(campN.id);
        let newUrl = new Url({
            "original_url": self.data.original_url,
            "campaign_id": campN.id
        });

        newUrl.create();
        callback(err, created_campaign);
        
    });
};

//allows to pass option override, no longer relying 100% on store.
Campaign.prototype.createCampaign = new Proxy(createCampaign, {
    apply: function (target, thisArg, argList) {
        if (argList.length === 2) {
            target.bind(thisArg)(...argList)
        } else {
            target.bind(thisArg)(undefined, ...argList);
        }
    }
});

Campaign.prototype.updateCampaign = async function () {
    let self = this;
    let store = require("../config/redux/store");
    let updatedCampaign = await self.update();
    store.dispatchEvent("campaign_updated", updatedCampaign);
    return updatedCampaign;
};

Campaign.prototype.deleteCampaign = function (callback) {
    let self = this;
    new Promise(function (resolve, reject) {
        NotificationTemplate.findAll("campaign_id", self.data.id, function(templates) {
            templates.map(function (template){
                template.delete(function (err, result) {
                    if(!err) {
                        return resolve(result);
                    } else {
                        return reject(err);
                    }
                });
            });
        })
    }).then(function(){
        return new Promise(function (resolve, reject) {
            Url.findAll("campaign_id", self.data.id, function(urls) {
                urls.map(function (url){
                    url.delete(function (err, result) {
                        if(!err) {
                            return resolve(result);
                        } else {
                            return reject(err);
                        }
                    });
                });
            })
        });

    }).then(function (){
        return new Promise(function (resolve, reject) {
            self.delete(function (err, deleted_campaign) {
                if (err) {
                    return reject('Campaign cannot be deleted, must be unpublish. Campaign has connected records!');
                }
                return resolve(`Campaign ${self.data.id} has been deleted from database!`);
            });
        });
    }).then(function () {
        callback(null, `Campaign ID: ${self.data.id} has been removed.`);
    }).catch(function (err) {
        callback(err, null);
    });
};

/**
 * @param callback - Final unpublish result, or error.
 */
//THERES NO CALLBACK
//THIS WAS CHANGED BUT CALLBACK NOT REMOVED
Campaign.prototype.unpublish = async function () {
    let self = this;
    self.data.published = false;
    return await self.update();
};

Campaign.prototype.republish = async function () {
    let self = this;
    self.data.published = true;
    return await self.update();
};

module.exports = Campaign;