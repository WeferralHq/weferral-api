let Webhook = require('../models/webhook');
module.exports = function(router) {
    router.post('/webhooks', function(req,res,next){
        let newWebhook = new Webhook(req.body);
        newWebhook.create(function(err,result){
            if(result){
                res.json({"message": "Webhook Successfully created"});
            }
        })
    });

    router.get('/webhooks/:campaign_id', function(req,res,next){
        let key = 'campaign_id';
        let value = req.params.campaign_id;
        if (!value) {
            key = undefined;
            value = undefined;
        }
        Webhook.findAll(key,value, function(result){
            if(result && result.length > 0){
                let webhooks = (result.map(entity => entity.data));
                res.status(200).json(webhooks);
            }else {
                res.json({"message": "Webhooks not found"});
            }
        })
    });
    
    require("./entity")(router, Webhook, "webhooks");
};