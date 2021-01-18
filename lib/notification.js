//findFilter({'user_id': value, 'status': 'running'}
let getNotificationSagas = (eventName,id) => async (dataObj, userToNotify) => {
    let NotificationTemplate = require("../models/notification-template");
    return new Promise(function (resolve, reject) {
        NotificationTemplate.findAll('campaign_id', id, function (templates) {
            resolve(templates.map((template) => {
                if(template.get('event_name') === eventName){
                    return template.createNotification(dataObj, userToNotify);
                }
            }))
            //return resolve (template.createNotification(dataObj, userToNotify));
            /*resolve(templates.map((template) => {
                    let callCreateNotification = function (action) {
                        return template.createNotification(action.event_object);
                    };

                    return call(function* () {
                        yield takeEvery(sagaEventPattern(template.get('event_name')), callCreateNotification)
                    });
                })
            )*/
        })
    });
}

module.exports = async function notification(event_name, id, modelObj, userToNotify) {

    let notificationSagas = await getNotificationSagas(event_name,id)(modelObj,userToNotify); 

}