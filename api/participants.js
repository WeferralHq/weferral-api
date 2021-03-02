let Participant = require("../models/participant");
let validate = require("./middlewares/validate");
let Campaign = require('../models/campaign');
let bcrypt = require("bcryptjs");
let Invitation = require('../models/invitation');
let EventLogs = require('../models/event-log');
let notification = require('../lib/notification');
let webhook = require('../lib/webhook');
let jwt = require("jsonwebtoken");
let Url = require("../models/url");
let ResetRequest = require("../models/password-reset-request");
let async = require("async");
let Commission = require("../models/commission");
let Reward = require('../models/reward');
let auth = require('./middlewares/auth');

module.exports = function(router) {

    router.post('/participant/invite/:campaign_id', auth(), async function (req, res, next) {
        let campaign_id = req.params.campaign_id;
        let campObj = (await Campaign.find({"id": campaign_id}))[0];
        let joinName = campObj.data.name.toLowerCase().replace(/\s+/g,"-");
        function reinviteParticipant(participant){
            let invite = new Invitation({
                "participant_id": participant.get('id')
            });
            invite.create(async function (err, result) {
                if (!err) {
                    let apiUrl = req.protocol + '://' + req.get('host') + "/api/v1/participant/" + campObj.data.name +"?token=" + result.get("token");
                    let frontEndUrl = process.env.FRONTEND_URL + "/" + joinName + "/invitation/" + result.get("token");
                    //EventLogs.logEvent(req.user.get('id'), `participants ${req.body.email} was reinvited by user ${req.user.get('email')}`);
                    res.locals.json = {token: result.get("token"), url: frontEndUrl, api: apiUrl};
                    result.set('url', frontEndUrl);
                    result.set('api', apiUrl);
                    res.locals.valid_object = result;
                    next();
                    await notification("participant_invited", campObj.data.id, participant, participant);
                    //dispatchEvent("user_invited", participant);
                } else {
                    res.status(403).json({error: err});
                }
            });

        }
        if (req.body.hasOwnProperty("email")) {
            let mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            if (!req.body.email.match(mailFormat)) {
                res.status(400).json({error: 'Invalid email format'});
            }
            else {
                let newParticipant = new Participant({
                    "email": req.body.email, 
                    "fname": req.body.fname || '',
                    "lname": req.body.lname || '',
                    "status": "invited",
                    "campaign_id": campaign_id
                });
                Participant.findAll("email", req.body.email, function (foundParticipants) {
                    if (foundParticipants.length != 0) {
                        Invitation.findOne("participant_id", foundParticipants[0].get("id"), invite => {
                            if(invite && invite.data){
                                invite.delete(()=>{
                                    reinviteParticipant(foundParticipants[0]);
                                })
                            }else{
                                res.status(400).json({error: 'This email already exists in the system'});

                            }
                        })
                    }
                    else {
                        newParticipant.createParticipant(function (err, resultParticipant) {
                            if (!err) {
                                let invite = new Invitation({"participant_id": resultParticipant.get("id")});
                                invite.create(async function (err, result) {
                                    if (!err) {
                                        let apiUrl = req.protocol + '://' + req.get('host') + "/api/v1/participant/" + campObj.data.name +"?token=" + result.get("token");
                                        let frontEndUrl = process.env.FRONTEND_URL + "/" + joinName + "/invitation/" + result.get("token");
                                        //EventLogs.logEvent(req.user.get('id'), `participants ${req.body.email} was invited by user ${req.user.get('email')}`);
                                        res.locals.json = {token: result.get("token"), url: frontEndUrl, api: apiUrl};
                                        newParticipant.set('url', frontEndUrl);
                                        newParticipant.set('api', apiUrl);
                                        res.locals.valid_object = result;
                                        next();
                                        await notification("participant_invited", campObj.data.id, newParticipant, newParticipant);
                                        //dispatchEvent("participant_invited", newParticipant);
                                    } else {
                                        res.status(403).json({error: err});
                                    }
                                });
                            } else {
                                res.status(403).json({error: err});
                            }
                        });
                    }
                })
            }
        }
        else {
            res.status(400).json({error: 'Must have property: email'});
        }
    });


    router.get('/participants', function(req,res){
        if (req.isAuthenticated()) {
            Participant.findAll(true, true, (results) => {
                if (results && results.length > 0) {
                    let participants = (results.map(entity => entity.data));
                    res.status(200).json(participants);
                }
            });
        }
    });

    router.get('/participant/commissions/:id', validate(Participant), function(req, res) {
        let participant = res.locals.valid_object;
        Commission.findAll('participant_id', participant.data.id, function(commissions){
            if(commissions && commissions.length > 0){
                async.mapSeries(commissions, function(parent, callback){
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
            }else {
                res.json({'message': 'No commissions'})
            }
        })
    });

    router.get('/participant/payouts/:id', validate(Participant), function(req, res) {
        let participant = res.locals.valid_object;
        Reward.findAll('participant_id', participant.data.id, function(rewards){
            if(rewards && rewards.length > 0){
                async.mapSeries(rewards, function(parent, callback){
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
            }else {
                res.json({'message': 'No pending payout'})
            }
        })
    });

    router.post('/participants/login/:campaignName', async function(req, res){
        let campaignName = req.params.campaignName;
        campaignName = campaignName.replace(/[^a-zA-Z ]/g, " ");
        let campObj = (await Campaign.find({"name": campaignName}))[0];
        if (campObj.data) {
            let results = (await Participant.find({'email': req.body.email, 'campaign_id': campObj.data.id}))[0];
            //await Participant.find({'email': req.body.email, 'campaign_id': campObj.data.id}, function(results) {
                // Check if participant exists
                if (!results.data) {
                    res.status(401).json({ error: "Email not found" });
                }
                bcrypt.compare(req.body.password, results.data.password).then(isMatch => {
                    if(isMatch){
                        res.cookie("pid", results.data.id);
                        let token = jwt.sign({  pid: results.data.id }, process.env.SECRET_KEY, { expiresIn: '3h' });
                        res.status(200).json({token:token});
                    }else{
                        res.status(401).json({ error: "Password incorrect" });
                    }
                })
            //});
        }
    });

    router.get('/participant/:id(\\d+)', validate(Participant), auth(), function(req,res){
        let participant = res.locals.valid_object;
        res.json(participant);
    });

    router.delete('/participant/:id(\\d+)', auth(), validate(Participant), function(req,res){
        let participant = res.locals.valid_object;
        participant.deleteParticipant(function(result){
            res.json(result);
        });
    });

    router.get('/participant/suspend/:id', auth(), validate(Participant), function(req,res){
        let participant = res.locals.valid_object;
        participant.suspend(async function(result){
            res.json(result);
            await notification("participant_suspended", result.data.campaign_id, result, result);
        });
    });

    router.get('/participant/approve/:id', auth(), validate(Participant), function(req,res){
        let participant = res.locals.valid_object;
        participant.approve(async function(result){
            res.json(result);
            await notification("participant_approved", result.data.campaign_id, result, result);
        });
    });

    router.get('/participant/disapprove/:id', auth(), validate(Participant), function(req,res){
        let participant = res.locals.valid_object;
        participant.disapprove(async function(result){
            res.json(result);
            await notification("participant_account_declined", result.data.campaign_id, result, result);
        });
    });

    router.get('/participant/profile/:id', validate(Participant), auth(), async function(req,res){
        let Obj = res.locals.valid_object;
        let url = (await Url.find({'campaign_id': Obj.data.campaign_id}))[0];
        let stats = await Obj.participantStats();
        Obj.data.url = url.data.original_url;
        let newObj = Object.assign(Obj.data, stats);
        res.json(newObj);
    });

    router.post("/participant/:campaignName/reset-password", async function(req, res, next){
        let campaignName = req.params.campaignName;
        campaignName = campaignName.replace(/[^a-zA-Z ]/g, " ");
        let campObj = (await Campaign.find({"name": campaignName}))[0];
        Participant.findOne("email", req.body.email, function(participant){
            if(participant.data){
                ResetRequest.findAll("participant_id", participant.get("id"), function(requests){
                    async.each(requests, function(request, callback){
                        request.delete(function(result){
                            callback();
                        })
                    }, function(err){
                        require('crypto').randomBytes(20, function(err, buffer) {
                            let token = buffer.toString("hex");
                            let reset = new ResetRequest({
                                participant_id: participant.get("id"),
                                hash: bcrypt.hashSync(token, 10)
                            });
                            reset.create(async function(err, newReset){
                                let frontEndUrl = `${req.protocol}://${req.get('host')}/reset-password/${participant.get("id")}/${token}`;
                                res.json({message: "Success"});
                                participant.set("token", token);
                                participant.set("url", frontEndUrl);
                                await notification("password_reset_request_created", campObj.data.id, participant, participant);
                                next();
                            })
                        });
                    });
                });
            }else{
                res.json({"message" : "Reset link sent"});
            }
        });
    });

    router.get("/participant/reset-password/:pid/:token",  function(req, res, next){
        console.log(bcrypt.hashSync(req.params.token, 10));
        ResetRequest.findOne("participant_id", req.params.pid, function(result){
            if(result.data && bcrypt.compareSync(req.params.token, result.get("hash"))){
                res.status(200).json({isValid: true});
            }else{
                res.status(400).json({isValid: false, error: "Invalid Reset Link"})
            }
        });
    });

    //todo -- token expiration
    router.post("/participant/reset-password/:pid/:token", function(req, res, next){
        ResetRequest.findOne("participant_id", req.params.pid , function(result){
            if(result.data && bcrypt.compareSync(req.params.token, result.get("hash"))){
                Participant.findOne("id", result.get("participant_id"), function(participant){
                    let password = bcrypt.hashSync(req.body.password, 10);
                    participant.set("password", password);
                    participant.update(function(err, updated){
                        res.json({"message" : "Password successfully reset"});
                        result.delete(function(r){
                           console.log("reset request deleted");
                        });
                    })
                })
            }else{
                res.status(400).json({error: "Invalid Reset Link"})
            }
        })

    });

    router.put("/participants/:id(\\d+)", auth(), validate(Participant), async function (req, res, next) {
        let participant = res.locals.valid_object;
        req.body.id = req.params.id;
        if (req.body.password) {
            req.body.password = bcrypt.hashSync(req.body.password, 10);
        }
        Object.assign(participant.data, req.body);
        console.log("updating the participant");
        let updateParticipant = await participant.update();
        await webhook('updated_participant', updateParticipant);
        delete updateParticipant.password;
        let out = {
            message: 'User is successfully updated',
            results: updateParticipant
        }
        res.json(out);
    });

    router.post('/participant/:campaignName/register', function(req, res) {
        let token = req.query.token;
        let campName = req.params.campaignName;
        campName = campName.replace(/[^a-zA-Z ]/g, " ");
        if (token) {
            Invitation.findOne("token", token, function (foundInvitation) {
                console.log(foundInvitation);
                if (!foundInvitation.data) {
                    res.status(500).send({error: "invalid token specified"})
                } else {
                    Participant.findById(foundInvitation.get("participant_id"), function (newParticipant) {
                        req.body.id = newParticipant.get("id");
                        req.body.password = bcrypt.hashSync(req.body.password, 10);
                        Object.assign(newParticipant.data, req.body);
                        newParticipant.set("status", "active");
                        newParticipant.update(function (err, updatedParticipant) {
                            foundInvitation.delete(async function (response) {
                                console.log("invitation deleted");
                                res.locals.json = updatedParticipant.data;
                                res.locals.valid_object = updatedParticipant;
                                res.status(200).json( updatedParticipant );
                                await webhook('new_participant', updatedParticipant);
                            })
                        })

                    });
                }
            });
        }else{
            Participant.findAll("email", req.body.email, (participant) => {
                if (participant && participant.length > 0) {
                    return res.status(400).json({error: "This email address has alraedy signed up for this Referral Program"});
                }
            });
            let columnName = ['fname', 'lname', 'email', 'password'];
            if(req.body.password){
                let password = require("bcryptjs").hashSync(req.body.password, 10);
                let mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                let metaArr = [];
                if (!req.body.email.match(mailFormat)) {
                    res.status(400).json({error: 'Invalid email format'});
                }else {
                    new Promise(function (resolve, reject) {
                        Campaign.findOne('name', campName, function (result) {
                            if (result.data) {
                                return resolve(result.data);
                            } else {
                                return reject('ERROR: No Campaign Found!');
                            }
                        });
                    }).then(function (campaign) {
                        let newParticipant = new Participant(req.body);
                        newParticipant.set('password', password);
                        Object.keys(req.body).forEach((key, index) => {
                            if (columnName.indexOf(key) < 0) {
                                metaArr.push(`${key}: ${req.body[key]}`);
                            }
                        });
                        let metadata = Object.assign({}, metaArr);
                        newParticipant.set('metadata', metadata);
                        newParticipant.set('campaign_id', campaign.id);
                        newParticipant.set('name', `${req.body.fname} ${req.body.lname}`);
                        if (campaign.auto_approve === true) {
                            newParticipant.set('status', 'active');
                        }
                        newParticipant.createParticipant(async function (err, result) {
                            
                            if (err) {
                                res.status(403).json({ error: err });
                            } else {
                                res.status(200).json( result );
                                await webhook('new_participant', result);
                            }
                        });
                    })
                }
            }
        }
        
    });

    require("./entity")(router, Participant, "participants");

    return router;
}