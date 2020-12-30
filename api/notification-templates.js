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
    })

    require("./entity")(router, NotificationTemplate, "notification-templates");

    return router;
}