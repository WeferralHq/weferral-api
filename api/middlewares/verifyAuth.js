let Participant = require("../../models/participant");

let extractToken = function(req){
    if(req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Basic'){
        return req.headers.authorization.split(' ')[1];
    } else if(req.query && req.query.token){
        return req.query.token;
    }
    return null;
}

let verifyAuth = function(){

    return async function(req, res, next) {
        let participant = res.locals.valid_object;

        if(participant.data.status == "suspended"){
            return res.status(401).json({"error" : "Participant suspended"});
        }
        let acctId = extractToken(req);

        if(acctId !== null){
            Participant.findOne('account_id', acctId, function(result){
                if(result.data){
                    return next();
                }
                return res.status(401).json({error: "Unauthorized participant"});
            })
        }else{
            return res.status(401).json({"error": "Unauthenticated"});
        }
    }
};

module.exports = verifyAuth;