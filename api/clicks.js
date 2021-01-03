let Click = require('../models/click');
let Customer = require('../models/customer');
let Campaign = require('../models/campaign');
let Participant = require('../models/participant');

let getUniqueCustId = function(){
    let random_code = Math.random().toString(36).substring(10, 12) + Math.random().toString(36).substring(10, 12);

    Customer.findOne('unique_id', random_code, function(result){
        if(result && result.length > 0){
            getUniqueCustId();
        }
    });

    return random_code;
}

module.exports = function(router) {

    router.get('/click/:referral_code', function(req, res) {
        let url_Id = req.params.referral_code;
        let unique_id = '';
        Participant.findOne('referral_code', url_Id, function (rows){
            if (rows.data) {
                if(rows.data.status === 'active') {
                    let campaign_id = rows.data.campaign_id;
                    let participant_id = rows.data.participant_id;
                    let newClick = new Click({
                        'campaign_id': campaign_id,
                        'participant_id': participant_id
                    });
                    if(!req.body.wefUid){
                        unique_id = getUniqueCustId();
                    }
                    let newCust = new Customer({
                        'unique_id': unique_id,
                        'campaign_id': campaign_id,
                        'participant_id': participant_id
                    })
                    newCust.createCustomer(function (err, result) {
                        if (!err) {
                            newClick.set('ip', req.connection.remoteAddress);
                            newClick.set('customer_id', result.data.id);
                            newClick.createClick(function (err, result) {
                                Campaign.findById(campaign_id, function(campaign) {
                                    if(!campaign.data){
                                        return res.status(401).json('Not found');
                                    }
                                    return res.status(200).json({'cookie_life': campaign.data.cookie_life, 'wef_uid': unique_id});
                                })
                            })

                        }
                    })
                }
            } else {
                return res.status(401).json('Not found');
            }
        });
    });

    require("./entity")(router, Click, "clicks");

    return router;
}