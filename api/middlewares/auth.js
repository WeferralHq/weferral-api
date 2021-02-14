let Role = require("../../models/role.js");
let swaggerJSON = require("../../api-docs/api-paths.json");


//todo:  allow for multiple permissions


/**
 *
 * @param user - User object from the request
 * @param callback - callback function with true if authorized false otherwise as param
 *
 */

let isAuthorized = function (user, callback){

    //TODO: clean this up so hasPermission can be passed multiple roles
    Role.findOne("id", user.get("role_id"), function(role){
        let adminStatus = false;
        if(role.get('name') === 'admin'){
            adminStatus = true;
        }
        callback(adminStatus)
    })
}


/**
 *
 * @param model - if model is defined the auth function will check for ownership, assumes there is user_id existing
 * @param correlation_id - string representing the field you want to check the params.id against
 *ip
 * @param bypassPermissions - permissions that will also be authenticated (used for ownership situations)
 * @returns {Function}
 */

 //todo: move parameters into a config json... icky icky!
let auth = function(permission=null, model=null, correlation_id="user_id", bypassPermissions=["can_administrate"]) {
    return function (req, res, next) {
        // if user is authenticated in the session, call the next() to call the next request handler
        // Passport adds this method to request object. A middleware is allowed to add properties to
        // request and response object


        let permissionToCheck = permission;

        if (!req.isAuthenticated()) {
            return res.status(401).json({"error": "Unauthenticated"});
        }

        if(req.user.data.status == "suspended"){
            return res.status(401).json({"error" : "Account suspended"});
        }

        isAuthorized(req.user, function (status) {
            res.locals.permissions = permissions;
                if(status){
                    if (model) {
                        //TODO be able to handle other ids, not just 'id'
                        let id = req.params.id;
                        model.findOne("id", id, function (result) {
                            console.log("correlation id: " + correlation_id + " " + req.user.get("id"));
                            if (result.get(correlation_id) == req.user.get("id")) {
                                console.log("user owns id " + id + "or has can_manage")
                                return next();
                            }
                            return res.status(401).json({error: "Unauthorized user"});

                        });
                        return;
                    }
                    else{
                        return next();
                    }
                }
                else{
                    return res.status(401).json({error: "Unauthorized user"});
                }
        });

    };
};

auth.isAuthorized = isAuthorized;

module.exports = auth;