//let auth = require('./middlewares/auth');
let validate = require('./middlewares/validate');
let User = require('../models/user');
let Invitation = require('../models/invitation');
let async = require("async");
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

    router.get('/users/own', function (req, res, next){
        let references = User.references || [];
        User.findAll(true, true, function (parents) {
            parents = parents.filter(resource => {
                return resource.get("id") == req.user.get("id");
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
    })

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