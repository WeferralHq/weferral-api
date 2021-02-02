
let Roles = require('../models/role');
module.exports = function(router) {

    router.get("/role/user/:uid", function(req, res, next){
        let user_id = req.params.uid;
        if (req.isAuthenticated()) {
            Roles.findOne("id", req.user.data.role_id, function(result){
                if(result.data.role_name === 'admin'){
                    res.json({"admin":true});
                }
            })
        }
        
    });

    require("./entity")(router, Roles, "roles");

    return router;
};