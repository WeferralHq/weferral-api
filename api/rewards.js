
let Reward = require('../models/reward');
let validate = require('./middlewares/validate');
let _ = require('lodash');
let Redemption = require('../models/redemption');
//let auth = require('../middleware/auth');
let async = require("async");

module.exports = function(router) {
    router.get('/reward/awaitingpayouts', function(req, res, next){
        let today = new Date().toISOString().slice(0,10);
        Reward.findAll(true, true,  function (result) {
            if(result && result.length > 0){
                result.attachReferences(updatedParent => {
                    let awaitingPayouts = _.filter(updatedParent, (payout) =>
                        payout.data.dateScheduledFor <= today &&
                        payout.data.assignedCredit > 0);

                    res.json(awaitingPayouts);
                });
            }
        })
    })
    router.get('/reward/payout/:id(\\d+)', validate(Reward), function(req, res, next){
        let reward = res.locals.valid_object;
        let today = new Date().toISOString().slice(0,10);
        let newRedeem = new Redemption({
            "reward_id": reward.data.id,
            "quantityRedeemed": reward.data.assignedCredit,
            "dateRedeemed": today
        });
        newRedeem.create(async function(err, newResult){
            if(!err){
                reward.data.redeemedCredit = reward.data.redeemedCredit + reward.data.assignedCredit;
                reward.data.assignedCredit = 0;
                let updateReward = await reward.update();
                res.json(updateReward);
            }
        })
    });

    router.get('/reward/:id(\\d+)', validate(Reward), function(req, res, next){
        let reward = res.locals.valid_object;
        reward.attachReferences(updatedParent => {
            res.status(200).json(updatedParent);
        });
    })
    require("./entity")(router, Reward, "rewards");
    return router;
};