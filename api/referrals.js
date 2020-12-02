let Referral = require("../models/campaign");
let dispatchEvent = require("../config/redux/store").dispatchEvent;
let store = require("../config/redux/store");
let validate = require("./middlewares/validate");

module.exports = function(router) {

    router.get('/api/v1/checkhash/:thisId', validate(Referral), function(req, res) {
        var url_Id = req.param('thisId');
        Referral.findOne('referral_code', url_Id, function (rows){
          if(rows.length !== 0){
            res.json(200);
          } else {
            res.json(401);
          }
        });
    });

    router.get('/api/v1/verifyhash/:thisId', function(req, res) {
        var url_Id = req.param('thisId');
        Referral.findAll('referral_code', url_Id, function(err, rows, fields){
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
}