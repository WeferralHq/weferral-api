let Role = require("../../models/role.js");
let swaggerJSON = require("../../api-docs/api-paths.json");
let Participant = require("../../models/participant");
let jwt = require('jsonwebtoken');

let extractToken = function(req){
    if(req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer'){
        return req.headers.authorization.split(' ')[1];
    } else if(req.query && req.query.token){
        return req.query.token;
    }
    return null;
}


//todo:  allow for multiple permissions


/**
 *
 * @param user - User object from the request
 * @param callback - callback function with true if authorized false otherwise as param
 *
 */

let isAuthorized = async function (user){
    let adminStatus = false;
    let role = (await Role.find({'id': user.get("role_id")}))[0];
    if(role.get('role_name') === 'admin'){
        adminStatus = true;
    }

    return adminStatus;
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
    return async function (req, res, next) {
        let isauthorize = await isAuthorized(req.user);
        if (isauthorize) {
            if (!req.isAuthenticated()) {
                return res.status(401).json({ "error": "Unauthenticated" });
            }

            if (req.user.data.status == "suspended") {
                return res.status(401).json({ "error": "Account suspended" });
            }
            if (model) {
                //TODO be able to handle other ids, not just 'id'
                let id = req.params.id;
                model.findOne("id", id, function (result) {
                    console.log("correlation id: " + correlation_id + " " + req.user.get("id"));
                    if (result.get(correlation_id) == req.user.get("id")) {
                        console.log("user owns id " + id + "or has can_manage")
                        return next();
                    }
                    return res.status(401).json({ error: "Unauthorized user" });

                });
                return;
            }
            else {
                return next();
            }
        }
        else {
            let participant = res.locals.valid_object;

            if (participant.data.status == "suspended") {
                return res.status(401).json({ "error": "Participant suspended" });
            }
            let token = extractToken(req);

            if (token !== null) {
                let obj = await jwt.verify(token, process.env.SECRET_KEY);
                Participant.findById(obj.pid, function (result) {
                    if (result.data) {
                        return next();
                    }
                    return res.status(401).json({ error: "Unauthorized participant" });
                })
            } else {
                return res.status(401).json({ "error": "Unauthenticated" });
            }
        }

    };
};

auth.isAuthorized = isAuthorized;

module.exports = auth;