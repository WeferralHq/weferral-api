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
    }
    ]

    //create default email templates
    NotificationTemplate.batchCreate(templates, function (emailResult) {
        return emailResult;
    })
}

module.exports = default_notifications;