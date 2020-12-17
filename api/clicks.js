let Click = require('../models/click');

module.exports = function(router) {

    router.post('/click/:referral_code', function(req, res) {
        let url_Id = req.param('referral_code');
        Participant.findOne('referral_code', url_Id, function (rows){
            if (rows && rows.length > 0) {
                if(rows.data.status !== 'active') {
                    let campaign_id = rows.data.campaign_id;
                    let participant_id = rows.data.participant_id;
                    let newClick = new Click({
                        'campaign_id': campaign_id,
                        'participant_id': participant_id
                    });
                    newClick.set('ip', req.connection.remoteAddress);
                    newClick.createClick(function(err, result) {
                        if(err){
                            return res.status(401).json(err);
                        }
                        return res.status(200).json({'message': 'Successfully created'});
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