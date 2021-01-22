
let Reward = require('../models/reward');
let validate = require('../middleware/validate');
//let auth = require('../middleware/auth');

module.exports = function(router) {
    router.get(`/rewards`, function(req, res, next){
        
    });
    router.get('/reward/:id', validate(Reward), function(req, res, next){
        
    })
    require("./entity")(router, Reward, "rewards");
    return router;
};