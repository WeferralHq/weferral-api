//let auth = require('./middlewares/auth');
//let validate = require('./middlewares/validate');
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

    require("./entity")(router, User, "users");

    return router;
};