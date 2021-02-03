let Participant = require("../../models/participant");
let jwt = require('jsonwebtoken');

let extractToken = function(req){
    if(req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer'){
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
        let token = extractToken(req);

        if(token !== null){
            let obj = await jwt.verify(token, process.env.SECRET_KEY);
            Participant.findById(obj.pid, function(result){
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