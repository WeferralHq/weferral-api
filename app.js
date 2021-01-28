var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var expressSession = require('express-session');
var flash = require('connect-flash');
var logger = require('morgan');
var passport = require('passport');
var path = require('path');
let architect = require("architect")
var helmet = require('helmet')

module.exports = function (initConfig = null) {
    let envPath = path.join(__dirname, 'env/.env');
    require('dotenv').config({path: envPath});

    return require('./config/init.js')(initConfig).then(function (init) {
        return new Promise(function (resolve, reject) {

            console.log(init);

            require('./config/passport.js')(passport);

            var app = express();
            app.use(helmet());
            //var subpath = express();

            app.use(function(req, res, next) {
                res.header("Access-Control-Allow-Origin", "http://localhost:4100");
                res.header("Access-Control-Allow-Credentials", true);
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Authorization, Accept, X-Custom-Header");
                res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
                if (req.method === "OPTIONS") {
                    return res.status(200).end();
                }
                next();
            });


            // uncomment after placing your favicon in /public
            //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

            app.use(logger('dev'));
            app.use(bodyParser.json());
            app.use(bodyParser.urlencoded({
                extended: false
            }));
            app.use(cookieParser());

            // TODO - Why Do we need this key ?
            app.use(expressSession({
                secret: process.env.SECRET_KEY,
                resave: true,
                saveUninitialized: true
            }));

            app.use(passport.initialize());
            app.use(passport.session());
            app.use(require("./api/middlewares/role-session")());
            app.use(flash());

            //auth route doesn't go in express route so it doesn't need auth
            require("./api/auth")(app, passport);

            //initialize api route
            var api = express.Router();
            app.use("/api/v1", api);

            //force all requests to api route to look for token, if token is present in header the user will be logged in with that token
            api.use(function (req, res, next) {
                passport.authenticate('jwt', function (err, user, info) {
                    if (err) {
                        return next(err);
                    }
                    if (!user) {
                        return next();
                    }
                    req.logIn(user, {
                        session: false
                    }, function (err) {
                        if (err) {
                            return next(err);
                        }
                        return next();
                    });
                })(req, res, next);
            });


            require('./api/users')(api, passport);
            require('./api/campaigns')(api);
            require('./api/participants')(api);
            require('./api/clicks')(api);
            require('./api/conversions')(api);
            require('./api/customers')(api);
            require('./api/notification-templates')(api);
            require('./api/campaign-system-options')(api);
            require('./api/notifications')(api);
            require('./api/rewards')(api);
            require('./api/commissions')(api);
            //require('./api/event-logs')(api);
            //require('./api/permissions')(api);
            //require('./api/roles')(api);
            require('./api/analytics')(api);
            require('./api/webhooks')(api);


            api.use(function (req, res, next) {
                if (res.locals.json) {
                    res.json(res.locals.json);
                } else {
                    next();
                }
            });

            app.get('*', async function (req, res) {
                if (req.path.split("/")[3] == "embed" && req.method === 'GET') {
                    res.removeHeader('X-Frame-Options');
                }
            })
    
    
            // catch 404 and forward to error handler
            app.use(function (req, res, next) {
                var err = new Error('Not Found');
                err.status = 404;
                next(err);
            });
    
            // error handler
            app.use(function (err, req, res, next) {
                // set locals, only providing error in development
                res.locals.message = err.message;
                console.error(err);
                res.locals.error = req.app.get('env') === 'development' ? err : "unhandled error has happened in server";
    
                // send the error
                res.status(err.status || 500).json({error: res.locals.error});
    
                //res.render('error');
            });

            resolve(app);

        })
    });
}