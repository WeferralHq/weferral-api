let Customer = require('../models/customer');
let Participant = require('../models/participant');
let webhook = require('../lib/webhook');

module.exports = function(router) {

    router.post('/import', function(req, res){
        console.log(req.body);
    })

    require("./entity")(router, Customer, "customers");

    return router;
}