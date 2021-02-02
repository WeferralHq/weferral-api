let _ = require("lodash")
let NotificationTemplate = require("./base/entity")("notification_templates");
let Notification = require("./notification");
let User = require("./user");
let Role = require("./role");
let knex = require('../config/db');
let mailer = require('../lib/mailer');

/**
 *
 * @param map -
 * @param callback
 */
NotificationTemplate.prototype.getRoles = function (callback) {
    let templateId = this.get('id');
    knex(Role.table).whereIn("id", function () {
        this.select("role_id").from("notification_templates_to_roles").where("notification_template_id", templateId)
    }).then(function (result) {
        callback(result.map(p => new Role(p)));
    }).catch(function (err) {
        console.log(err);
    })
};

NotificationTemplate.prototype.setRoles = function (roleIds, callback) {
    let templateId = this.get("id");
    let links = [];
    knex("notification_templates_to_roles").where("notification_template_id", templateId).delete().then(function (result) {
        roleIds.forEach(id => {
            let notificationToRole = {"role_id": id, notification_template_id: templateId}
            links.push(notificationToRole);
        });
        knex("notification_templates_to_roles").insert(links).then(callback);
    })
};
NotificationTemplate.prototype.build = function (map, callback) {
    let parseTemplate = function (match, replaceString, offset, string) {
        let splitStr = replaceString.split(".");
        if (splitStr.length > 1) {
            splitStr[1] += "[0]";
            replaceString = splitStr.join(".");
        }
        return _.get(map.data, replaceString);
    };

    const regex = /\[\[([\w, \.]+)]]/gm;
    let message = this.get("message").replace(regex, parseTemplate);
    let subject = this.get("subject").replace(regex, parseTemplate);

    callback(message, subject);


};

NotificationTemplate.prototype.createNotification = async function (object, userToNotify) {
    let self = this;
    let notificationContent = await getNotificationContents(self, object);
    let usersToNotify = userToNotify;

    if(self.get('send_to_owner')) {
        let owner = new Promise((resolve, reject) => {
            let userId = self.get("model") === 'user' ? object.get('id') : object.get('user_id');
            User.findOne("id", userId, function (user) {
                resolve(user);
            })
        });
        usersToNotify.push(owner);
    }
    console.log(`trying to send message: ${notificationContent.message} to ---------->`);
    console.log(usersToNotify)

    return Promise.all([createNotifications(usersToNotify, notificationContent.message, notificationContent.subject, self),
        createEmailNotifications(usersToNotify, notificationContent.message, notificationContent.subject, self)])
};

let getNotificationContents = function(template, targetObject){

    return new Promise(function (resolve, reject) {
        //Attach references
        targetObject.attachReferences(updatedObject => {
            //let store = require('../config/redux/store');
            //let globalProps = store.getState().options;
            //Object.keys(globalProps).forEach(key => updatedObject.set("_" + key, globalProps[key]));
            return resolve(updatedObject)
        });
    }).then(updatedObject => {
        return new Promise(function (resolve, reject) {
            //Build Message and Subject from template
            template.build(updatedObject, function (message, subject) {
                console.log("Built Notification message")
                return resolve({message: message, subject: subject})
            });
        });
    }).catch(e => {
        console.log('error when getting notification contents: ', e);
    });
};

let getRoleUsers = function(template){
    return new Promise(function (resolve, reject) {
        template.getRoles(function (roles) {
            console.log(roles)
            resolve(roles)
        })
    }).then((result) => Promise.all(result.map(role => {
        return new Promise(resolve => {
            role.getUsers(users => {
                return resolve(users)
            })
            })
        })
    )).then(usersInRoles => {
        let users = usersInRoles.reduce((allUsers, userInRole) => allUsers.concat(userInRole), []);
        return users
    }).catch(e => {
        console.log('error when getting list of users from roles: ', e);
    });
};

let createNotifications = function(recipient, message, subject, notificationTemplate){
    if(notificationTemplate.get('create_notification')) {
        //return Promise.all(recipients.map(recipient => {
            return new Promise((resolve, reject) => {
                let notificationAttributes = {
                    message: message,
                    participant_id: recipient.get('id'),
                    subject: subject
                };
                //Create Notification
                let newNotification = new Notification(notificationAttributes);
                newNotification.create(function (err, notification) {
                    if (!err) {
                        console.log("notification created: " + notification.get("id"));
                        return resolve(notification);
                    } else {
                        return reject(err);
                    }
                });
            }).catch(e => {
                console.log('error when creating notification: ', e)
            })
        //}))
    }
    else{
        console.log("no notifications to create")
        return true;
    }
};

let createEmailNotifications = function(recipient, message, subject, notificationTemplate){
    if(notificationTemplate.get('send_email')){
        let additionalRecipients = notificationTemplate.get('additional_recipients');
        let emailArray = [];
        let emailAddress = recipient.get('email');
        emailArray.push(emailAddress);
        emailArray = _.union(emailArray, additionalRecipients);
        console.log("email array")
        console.log(emailArray)
        return Promise.all(emailArray.map(email => {
            return new Promise(resolve => {
                mailer(email, message, subject);
                return resolve();
            })
        })).catch(e => {
            console.log("error sending email notifications", e)
        })
    }
    else{
        console.log("no emails to send")
        return true;
    }
}

module.exports = NotificationTemplate;