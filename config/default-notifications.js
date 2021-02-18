let NotificationTemplate = require('../models/notification-template');

let default_notifications = async function(campaign_id) {
    let templates = [
        {name:"password_reset",
        campaign_id: campaign_id,
        event_name:"password_reset_request_created",
        message:"Follow the following link to <a href='[[url]]'>reset your password</a>.",
        subject:"Weferral password reset",
        model:"user",
        send_email:true
    },
    {name:"invitation",
        campaign_id: campaign_id,
        event_name:"user_invited",
        message:"Hello there, \r\nYou have been invited to use the [[_company_name]] Weferral System. From <a href='[[_hostname]]'>here</a> you can manage your campaigns, and see other campaign options. Please click the link to begin user <a href='[[url]]'>registration</a>.",
        subject:"Weferral Invitation!",
        model:"user",
        send_email:true
    },
    {name:"participant_invitation",
        campaign_id: campaign_id,
        event_name:"participant_invitated",
        message:"Hello there, \r\nYou have been invited to use the [[_company_name]] Weferral System. From <a href='[[_hostname]]'>here</a> you can manage your campaigns, and see other campaign options. Please click the link to begin user <a href='[[url]]'>registration</a>.",
        subject:"Weferral Invitation!",
        model:"participant",
        send_email:true
    },
    {name:"registration_user",
        event_name:"user_registered",
        campaign_id: campaign_id,
        message:"Your registration has been completed! You can now access your account at <a href='[[_hostname]]'>here</a>. Thank you for choosing [[_company_name]].",
        subject:"Weferral registration complete",
        model:"user",
        send_email:true
    },
    {name:"user_suspension",
        event_name:"user_suspended",
        campaign_id: campaign_id,
        message:"Your Weferral account has been suspended. Please contact your service provider and check the state of your <a href='[[_hostname]]/profile'>account</a>.",
        subject:"Weferral Account Suspended",
        model:"user",
        send_email:true
    },
    {name:"participant_suspension",
        event_name:"participant_suspended",
        campaign_id: campaign_id,
        message:"Your Weferral account has been suspended. Please contact your service provider and check the state of your <a href='[[_hostname]]/profile'>account</a>.",
        subject:"Weferral Account Suspended",
        model:"participant",
        send_email:true
    },
    {name:"participant_approval",
        event_name:"participant_approved",
        campaign_id: campaign_id,
        message:"Your Weferral account has been approved. You can now login to your <a href='[[_hostname]]/profile'>account</a> and start sharing your referral links.",
        subject:"Weferral Account Approved",
        model:"participant",
        send_email:true
    },
    {name:"admin_new_sale",
        event_name:"admin_new_sale",
        campaign_id: campaign_id,
        message:"Dear Sir/Madam,\r\n\r\nYou have a new sale on your site.  If you chose to approve sales, you will need to login to your admin panel and either approve or decline this sale.",
        subject:"New Participant Sale",
        model:"user",
        send_email:true
    },
    {name:"participant_account_declined",
        event_name:"participant_account_declined",
        campaign_id: campaign_id,
        message:"Dear [[name]],\r\n\r\nWe're sorry to inform you that we have decided not to approve your participant account at this time.  If you''d like more information, please respond to this email and we''d be happy to explain our decision in more details.\r\n', 'Sincerely,\r\n\r\nParticipant Manager\r\n[[_company_name]]\r\n[[url]]",
        subject:"[[references.urls.original_url]] Participant Decline Notice",
        model:"participant",
        send_email:true
    },
    {name:"referral_new_sale_generated",
        event_name:"referral_new_sale_generated",
        campaign_id: campaign_id,
        message:"Dear [[name]],\r\n\r\nCongratulations!  You''ve generated a sale on the [[references.campaigns.name]] referral program.  Be sure to login to your account and check your accounting history and current stats.",
        subject:"New Sale Notification - [[references.campaigns.name]]",
        model:"participant",
        send_email:true
    },
    {name:"participant_commission_payment",
        event_name:"participant_commission_payment",
        campaign_id: campaign_id,
        message:"Dear [[name]],\r\n\r\nWe have sent your commission check for this month.  Be sure to login and check your financial history as well as other important stats.  We hope to continue building a strong partnership with you!\r\n\r\nCommission Amount: [[references.rewrds.redeemedCredit]]\r\n.",
        subject:"Payment Notification - [[references.campaigns.name]]",
        model:"participant",
        send_email:true
    },
    {name:"participant_awaiting_payouts",
        event_name:"participant_awaiting_payouts",
        campaign_id: campaign_id,
        message:"Hi [[name]],\r\n\r\nClick here [[url]] to see participant with awaiting payouts for this month.",
        subject:"Awaiting Commission Payout for this month",
        model:"user",
        send_email:true
    }
    ]

    //create default email templates
    NotificationTemplate.batchCreate(templates, function (emailResult) {
        return emailResult;
    })
}

module.exports = default_notifications;