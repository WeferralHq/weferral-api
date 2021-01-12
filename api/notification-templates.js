let NotificationTemplate = require('../models/notification-template');
let validate = require('./middlewares/validate');

module.exports = function(router) {

    router.get('/notification-templates/:campaign_id', function(req, res, next) {
        let id = req.params.campaign_id;
        NotificationTemplate.findAll('campaign_id', id, (templates) => {
            if (templates && templates.length > 0) {
                let AllTemplates = (templates.map(entity => entity.data));
                return res.status(200).json(AllTemplates);
            }
        });
    });

    router.get("/notification-template/:id(\\d+)", validate(NotificationTemplate), function(req, res, next){
        let modelName = res.locals.valid_object.get("model");
        let model =  require("../models/" + modelName);
        model.getSchema(true, false, function(result){
            let template = res.locals.valid_object;
            template["schema"] = result;
            console.log(template);
            res.json(template);
        });
    });

    router.post('/email-template/:id', function(req, res){
        let id = req.params.id;
        NotificationTemplate.findById(id, async function(template){
            if (template.data) {
                Object.assign(template.data, req.body);
                await template.update();
                return res.status(200).json({'message': 'Email successfully updated'})
            }
        });
    })

    require("./entity")(router, NotificationTemplate, "notification-templates");

    return router;
}