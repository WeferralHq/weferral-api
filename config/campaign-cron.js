let cron = require('node-cron');
let webhook = require('../lib/webhook');

function getTrialEnd(campaign) {
    let trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + campaign.data.trial_period_days);
    return trialEnd;
}

function startTimer(campaign,amount,newCommission){
    let trialEnd = new Date();
    if(campaign.data.trial_period_days > 0){
        trialEnd = getTrialEnd(campaign);
    }
    let task = cron.schedule(trialEnd, trialExpiration(campaign,amount,newCommission));
    
}

function trialExpiration(campaign,amount,newCommission) {
    let rewardType = campaign.data.reward_type;
    let rewardPrice = campaign.data.reward_price;
    let commissionType = campaign.data.commission_type;
    if(rewardType === 'cash_reward' && commissionType === 'fixed'){
        newCommission.set('amount', rewardPrice);
        newCommission.CreateCommission(campaign,async function(created_comm){
            await webhook('new_commission', created_comm);
            console.log({'message': 'Successful'});
        })
    }else if(rewardType === 'cash_reward' && commissionType === 'percentage_sale'){
        let perc = ((rewardPrice / 100) * amount).toFixed(3);
        newCommission.set('amount', perc);
        newCommission.CreateCommission(campaign,async function(created_comm){
            await webhook('new_commission', created_comm);
            console.log({'message': 'Successful'});
        })
    } else {
        newCommission.create(function(created_comm){
            console.log(created_comm);
        })
    }
}

module.exports = async function campaignCron(campaign,amount,newCommission) {

    let getTimer = await startTimer(campaign,amount,newCommission); 

}