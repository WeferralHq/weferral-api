let Commission = require('../models/commission');
module.exports = function(router) {
    
    require("./entity")(router, Commission, "commissions");
};