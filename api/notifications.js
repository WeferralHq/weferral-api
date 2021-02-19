
let Notification = require('../models/notification');
let validate = require('./middlewares/validate');
let async = require("async");
let auth = require('./middlewares/auth');

module.exports = function(router) {
    router.get(`/notifications/own`, auth(), function(req, res, next){
        let references = Notification.references || [];
        Notification.findAll(true, true, function (parents) {
            parents = parents.filter(resource => {
                return resource.get("user_id") == req.user.get("id");
            });
            if (references === undefined || references.length == 0 || parents.length == 0) {
                let out = (parents.map(entity => entity.data));
                res.json(out);
            }
            else {
                async.mapSeries(parents, function(parent, callback){
                    parent.attachReferences(function(updatedParent){
                        callback(null, updatedParent);
                    })
                },function(err, result){
                    if(err){
                        console.error("error attaching references: ", err);
                    }
                    else{
                        let out = result.map(entity => entity.data);
                        res.json(out);
                    }

                })
            }
        });
    });
    
    require("./entity")(router, Notification, "notifications");

    return router;
};