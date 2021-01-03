let NotificationTemplate = require('../models/notification-template');

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

    router.get('/notification-template/:id', function(req, res, next) {
        let id = req.params.id;
        NotificationTemplate.findById(id, function(template){
            if (template.data) {
                return res.status(200).json(template);
            }
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