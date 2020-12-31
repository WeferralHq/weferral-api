let emitter = require("../config/emitter");
let fetch = require("node-fetch");
let Promise = require("bluebird");
let db = require('../config/db');

const headers = {
    "Content-Type": "application/json",
    "Accepts": "application/json"
};

let sendToWebhooks = (eventName) => async (event, sync_all = false) => {
    let webhooks = await db("webhooks").where(true, true);
    let webhook_responses = await Promise.reduce(webhooks, async (responses, webhook) => {

        let parsedEvent = Object.entries(event).reduce((acc, [key, eventValue]) => {
            acc[key] = eventValue.data ? eventValue.data : eventValue;
            return acc;
        }, {});
        let webhookRequest = fetch(webhook.endpoint_url, {method: "POST", body: JSON.stringify({event_name : eventName, event_data : parsedEvent}), headers})
            .then(response => {
                if (!response.ok) {
                    console.error("error making webhook request", response.statusText);
                }
                db("webhooks").where("id", webhook.id).update({health: response.statusText}).then(result => {

                })
                return response
            })
            .catch(error => {
                let health = error.errno || error
                db("webhooks").where("id", webhook.id).update({health}).then(result => {

                })
            });

        //if its not async, store responses
        if (!webhook.async_lifecycle || sync_all) {
            try {
                responses[webhook.endpoint_url] = await (await webhookRequest).json();
            }catch(e){
                console.error("unable to get response from webhook: ", e);
            }
        }
        return responses
    }, {});
    return {webhook_responses};
};

module.exports = function webhook() {

    emitter.on("new_customer", (customer)=>{
        await sendToWebhooks("new_customer")(customer, true); 
    });
}