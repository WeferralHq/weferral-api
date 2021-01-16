//let auth = require('./middlewares/auth');
let validate = require('./middlewares/validate');
let User = require('../models/user');
let Invitation = require('../models/invitation');
//let EventLogs = require('../models/event-log');
//let path = require("path");
//let mkdirp = require("mkdirp");
//let bcrypt = require("bcryptjs");
//let Role = require("../models/role");


module.exports = function (router, passport) {
    router.get('/invitation/:invitation_id', function (req, res, next) {
        Invitation.findOne("token", req.params.invitation_id, function (result) {
            if (result.data) {
                return res.json({"status": "valid token"});
            } else {
                return res.status(404).json({status: "bad token"});
            }
        });
    });

    router.put("/users/:id(\\d+)", validate(User), function (req, res, next) {
        let user = res.locals.valid_object;
        if (user.get("id") == req.user.get("id")) {
            delete user.data.role_id;
        }
        req.body.id = req.params.id;
        if (req.body.password) {
            req.body.password = bcrypt.hashSync(req.body.password, 10);
        }
        Object.assign(user.data, req.body);
        console.log("updating the user");
        user.updateUser(function (err, result) {
            if (!err) {
                delete result.password;
                let out = {
                    message: 'User is successfully updated',
                    results: result
                }
                res.json(out);
            } else {
                res.json({message: `Error updating the user ${err}`});
            }
        });
    });

    require("./entity")(router, User, "users");

    return router;
};