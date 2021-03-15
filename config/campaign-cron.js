let cron = require('node-cron');
let webhook = require('../lib/webhook');
let notification = require('../lib/notification');
let Participant = require('../models/participant');

function getTrialEnd(campaign) {
    let trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + campaign.data.trial_period_days);
    return trialEnd;
}

function getRecurringEnd(campaign) {
    let recurringEnd = campaign.data.recurring_end_date;
    if (recurringEnd !== null) {
        recurringEnd = new Date(campaign.data.recurring_end_date * 1000);
    } else {
        return null;
    }
    return trialEnd;
}

function startTimer(campaign,amount,newCommission){
    let trialEnd = new Date();
    if(campaign.data.trial_period_days > 0){
        trialEnd = getTrialEnd(campaign);
    }
    let task = cron.schedule(trialEnd, trialExpiration(campaign,amount,newCommission));
    
}

async function trialExpiration(campaign,amount,newCommission) {
    let recurringEnd = getRecurringEnd(campaign);
    let rewardType = campaign.data.reward_type;
    let rewardPrice = campaign.data.reward_price;
    let commissionType = campaign.data.commission_type;
    let participant = (await Participant.find({'id': campaign.data.participant_id}))[0];
    if(recurringEnd !== null && recurringEnd > new Date()){
        if(rewardType === 'cash_reward' && commissionType === 'fixed'){
            newCommission.set('amount', rewardPrice);
            newCommission.CreateCommission(campaign,async function(created_comm){
                await notification("referral_new_sale_generated", campaign.data.id, participant, participant);
                await webhook('new_commission', created_comm);
                console.log({'message': 'Successful'});
            })
        }else if(rewardType === 'cash_reward' && commissionType === 'percentage_sale'){
            let perc = ((rewardPrice / 100) * amount).toFixed(3);
            newCommission.set('amount', perc);
            newCommission.CreateCommission(campaign,async function(created_comm){
                await notification("referral_new_sale_generated", campaign.data.id, participant, participant);
                await webhook('new_commission', created_comm);
                console.log({'message': 'Successful'});
            })
        } else {
            newCommission.create(async function(created_comm){
                await notification("referral_new_sale_generated", campaign.data.id, participant, participant);
                await webhook('new_commission', created_comm);
                console.log(created_comm);
            })
        }
    }
}

module.exports = async function campaignCron(campaign,amount,newCommission) {

    let getTimer = await startTimer(campaign,amount,newCommission); 

}