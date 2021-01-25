let Participant = require("../models/participant");
//let dispatchEvent = require("../config/redux/store").dispatchEvent;
//let store = require("../config/redux/store");
let validate = require("./middlewares/validate");
let Campaign = require('../models/campaign');
let bcrypt = require("bcryptjs");
let Invitation = require('../models/invitation');
let EventLogs = require('../models/event-log');
let notification = require('../lib/notification');
//const { delete } = require("../config/db");

module.exports = function(router) {

    router.get('/checkhash/:referral_code', validate(Participant), function(req, res) {
        let url_Id = req.param('referral_code');
        Participant.findOne('referral_code', url_Id, function (rows){
            if (rows && rows.length > 0) {
                if(rows.data.status !== 'active') {
                    let campId = rows.data.campaign_id;
                    Campaign.findById(campId, function(err, result) {
                        if(err){
                            return res.status(401).json('Not found');
                        }
                        return res.status(200).json({'cookie_life': result.data.cookie_life});
                    })
                }
            } else {
                return res.status(401).json('Not found');
            }
        });
    });

    router.post('/participant/invite/:campaign_id', async function (req, res, next) {
        let campaign_id = req.params.campaign_id;
        let campObj = (await Campaign.find({"id": campaign_id}))[0];
        function reinviteParticipant(participant){
            let invite = new Invitation({
                "participant_id": participant.get('id')
            });
            invite.create(async function (err, result) {
                if (!err) {
                    let apiUrl = req.protocol + '://' + req.get('host') + "/api/v1/participant/" + campObj.data.name +"?token=" + result.get("token");
                    let frontEndUrl = req.protocol + '://' + req.get('host') + "/invitation/" + result.get("token");
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
                                        let frontEndUrl = req.protocol + '://' + req.get('host') + "/invitation/" + result.get("token");
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
        Participant.findAll(true, true, (results) => {
            if (results && results.length > 0) {
                let participants = (results.map(entity => entity.data));
                return res.status(200).json(participants);
            }
        });
    });

    router.get('/participant/:id(\\d+)', validate(Participant), function(req,res){
        let participant = res.locals.valid_object;
        res.json(participant);
    });

    router.delete('/participant/:id(\\d+)', validate(Participant), function(req,res){
        let participant = res.locals.valid_object;
        participant.deleteParticipant(function(result){
            res.json(result);
        });
    });

    router.get('/participant/suspend/:id', validate(Participant), function(req,res){
        let participant = res.locals.valid_object;
        participant.suspend(function(result){
            res.json(result);
        });
    });

    router.get('/participant/profile/:id', validate(Participant), async function(req,res){
        let Obj = res.locals.valid_object;
        let stats = await Obj.participantStats();
        let newObj = Object.assign(Obj.data, stats);
        res.json(newObj);
    });

    router.put("/participants/:id(\\d+)", validate(Participant), async function (req, res, next) {
        let participant = res.locals.valid_object;
        req.body.id = req.params.id;
        if (req.body.password) {
            req.body.password = bcrypt.hashSync(req.body.password, 10);
        }
        Object.assign(participant.data, req.body);
        console.log("updating the participant");
        let updateParticipant = await participant.update();
        delete updateParticipant.password;
        let out = {
            message: 'User is successfully updated',
            results: updateParticipant
        }
        res.json(out);
    });

    router.get('/api/v1/verifyhash/:thisId', function(req, res) {
        var url_Id = req.param('thisId');
        Participant.findAll('referral_code', url_Id, function(err, rows, fields){
            if(err) throw err;
            if(rows.length !== 0) {
                var approvedBy = rows.data.approved_by;
                var status = rows.data.status;
                var emailaddress = rows.data.email;
                //if not yet verified, change status to verified
                if(status === "disconnected") {
                    connection.query('UPDATE emails SET `verified`=(?) WHERE `referralcode`=(?)',["true", url_Id], function(err, rows, fields){
                        if(err) throw err;
                        //add email address to contact list now that it's verified
                        var addContact = sg.emptyRequest({
                          method: 'POST',
                          path: '/v3/contactdb/recipients',
                          body: [{ "email": emailaddress }]
                        });
                        sg.API(addContact, function(error, response) {
                            var recipient_Id = response.body.persisted_recipients.toString();
                            var addContactToList = sg.emptyRequest({
                              method: 'POST',
                              path: '/v3/contactdb/lists/' + adminConfig.list_Id + '/recipients/' + recipient_Id,
                            });
                            sg.API(addContactToList, function(error, response) {
                                //add response
                            });
                        });
                        //add a referral point to the contestant that referred the newly verified contestant
                        connection.query('UPDATE emails SET referrals = referrals + 1 WHERE `emailaddress`=(?)',[referredBy], function(err, rows, fields){
                            if(err) throw err;
                        });
                    });
                }
                res.json(200);
            } else {
                res.json(401);
            }
        });
    });

    router.post('/participant/:campaignName', function(req, res) {
        let campName = req.params.campaignName;
        campName = campName.replace(/[^a-zA-Z ]/g, " ");

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
                    newParticipant.createParticipant(function (err, result) {
                        
                        if (err) {
                            res.status(403).json({ error: err });
                        } else {
                            res.status(200).json( result );
                        }
                    });
                })
            }
        }
    });

    require("./entity")(router, Participant, "participants");

    return router;
}