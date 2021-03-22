let CampaignSystemOption = require('../models/campaign-sys-option');
let Campaign = require("../models/campaign");
let Participant = require("../models/participant");
let cloudinary = require('../config/cloudinary');
let File = require('../models/file');
let path = require("path");
let multer = require("multer");
let upload = multer({dest: 'images/'});
let auth = require("./middlewares/auth");
let User = require("../models/user");
let validate = require("./middlewares/validate");
//let systemFilePath = "uploads/system-options";

let systemFiles = ['front_page_image', 'brand_logo', 'brand_assets'];

module.exports = function(router) {

    router.post('/system-options/file/:id/:campaign_id', auth(), upload.single('file'), function (req, res, next){
        if (systemFiles.indexOf(req.params.id) > -1) {
            let campaign_id = req.params.campaign_id;
            cloudinary.uploader.upload(req.file.path).then((result) => {
                let newFile = new File({
                    'campaign_id': campaign_id,
                    'name': req.params.id,
                    'file_name': req.file.originalname,
                    'url': result.secure_url,
                    'public_id': result.public_id
                })

                newFile.create(function (err, result) {
                    if (!err) {
                        res.send({'logo': result.data.url});
                    }
                })
            })
        }
    });

    router.get('/system-options/file/:id/:campaign_id', auth(),async function (req, res, next){
        let campaign_id = req.params.campaign_id;
        if (systemFiles.indexOf(req.params.id) > -1) {
            if(req.params.id == "brand_logo"){
                let image = (await File.find({'name': req.params.id, 'campaign_id': campaign_id}))[0];
            //File.findOne('name', req.params.id, function (image) {
                if(image === undefined){
                    //todo: make less hardcoded.. maybe seperate api calls again
                    return res.send({'logo': path.join(__dirname, "../public/assets/weferral.svg")});
                } else {
                    let fileUrl = image.data.url;
                    res.send({'logo': fileUrl});
                }
            }else if(req.params.id == "brand_assets"){
                let assets = (await File.find({'name': req.params.id, 'campaign_id': campaign_id}));
                let brand_assets = (assets.map(entity => entity.data));
                res.json(brand_assets);
            }
            
            //});
        }
        else {
            res.status("400").send("not a valid system file option");
        }
    });

    router.get('/system-options/participant/file/brand_assets/:id', validate(Participant), auth(), function (req, res, next) {
        let participant_id = req.params.pid;
        let brand = 'brand_assets'
        Participant.findById(participant_id, async function (result) {
            let assets = (await File.find({ 'name': brand, 'campaign_id': result.data.campaign_id }));
            let brand_assets = (assets.map(entity => entity.data));
            res.json(brand_assets);
        })
    });

    router.get('/secret-key', auth(), async function(req, res, next){
        let secretKey = process.env.SECRET_KEY;
        let user = (await User.find({'id': req.user.data.id}))[0];
        res.json({'secretKey': secretKey, 'account_id': user.data.account_id});
    });

    router.get('/system-options/file/:id', auth(), function (req, res, next){
        let campaign_id = req.params.id;
        File.findAll("campaign_id", campaign_id, function (results) {
            res.json(results.map(entity => entity.data));
        })
    })

    router.delete('/system-options/file/:id', auth(), validate(File), function (req, res, next){
        let file = res.locals.valid_object;
        file.delete(function (err, result) {
            if(err){
                console.error("Server error deleting entity: " + err);
                res.status(500).send({ error: "Error deleting" })
            }
            else {
                //store.dispatchEvent(`${model.table}_deleted`, entity);
                res.json({message: `File with id ${req.params.id} deleted`});
            }
        })
    })

    router.get(`/campaign-system-options/:campaignId`, function (req, res, next) {
        let campaignId = req.params.campaignId;
        CampaignSystemOption.findAll("campaign_id", campaignId, function (results) {
            res.json(results.reduce((acc, entity) => {
                acc[entity.data.option] = entity.data;
                return acc;
            }, {}));
        });
    });

    router.get('/system-setting/:campaignName', async function (req, res, next) {
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
    });

    router.get('/system-setting/brand_logo/:campaignName', async function (req, res, next) {
        let campaignName = req.params.campaignName.replace(/-/g, ' ');
        Campaign.findOne("name", campaignName, function (campaigns) {
            if (campaigns.data) {
                let campaignId = campaigns.data.id;

                File.findOne("campaign_id", campaignId, function (results) {
                    if(results.data){
                        let fileUrl = results.data.url;
                        res.send({'brand_logo': fileUrl});
                    }
                });
            }
        });
    })

    router.put('/system-settings/:campaignId', auth(), function (req, res, next) {
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