var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var expressSession = require('express-session');
const knexSession = require("connect-session-knex")(expressSession);
var flash = require('connect-flash');
var logger = require('morgan');
var passport = require('passport');
var path = require('path');
var helmet = require('helmet')
let consume = require("pluginbot/effects/consume");
let {call, put, spawn, takeEvery, select} = require("redux-saga/effects")
let HOME_PATH = path.resolve(__dirname, "../../", "public");
let createServer = require("./server");

module.exports = {
    run: function* (config, provide, services) {
        let appConfig = config.appConfig;
        var app = express();
        app.use(helmet({
            frameguard: false
        }));
        var exphbs = require('express-handlebars');
        app.engine('handlebars', exphbs({defaultLayout: 'main', layoutsDir: HOME_PATH}));
        app.set('view engine', 'handlebars');
        app.set('views', HOME_PATH);

        if(appConfig.trustProxy){
            app.enable("trust proxy");
        }
        app.use(logger('dev'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({
            extended: false
        }));

        //todo: possibly unsafe? -- look to make this configurable, rather have opt-in than opt-out so default is secure
        app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Credentials", true);
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            next();
        });

        app.use(cookieParser());
        app.use(express.static(path.join(__dirname, '../../public')));
        yield provide({expressApp: app});

        //wait for database to become available
        let database = yield consume(services.database);

        let CONFIG_PATH = appConfig.configPath;
        require('../../config/passport.js')(passport);
        yield provide({passport});
        let hostname = process.env.VIRTUAL_HOST || "localhost";


        let KnexStore = new knexSession({knex: database});
        //todo: move this into a plugin
        app.use(expressSession({
            secret: process.env.SECRET_KEY,
            resave: true,
            saveUninitialized: true,
            store: KnexStore

        }));

        app.use(passport.initialize());
        app.use(passport.session());
        app.use(require("../../middleware/role-session")());
        app.use(flash());

        //auth route doesn't go in express route so it doesn't need auth

        //initialize api route
        var api = express.Router();
        app.use("/api/v1", api);
        require("../../api/auth")(api, passport);

        //force all requests to api route to look for token, if token is present in header the user will be logged in with taht token
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

        //todo: move apis to plugins.
        require('../api/campaigns')(api, passport);
        require('../api/users')(api);
        require('../api/event-logs')(api);
        require('../api/notification-templates')(api);
        require('../api/notifications')(api);
        require('../api/permissions')(api);
        require('../api/roles')(api);
        let routeConsumer = require("./router");
        let authService = yield consume(services.authService);
        yield spawn(routeConsumer, api, services.routeDefinition, authService);


        api.use(function (req, res, next) {
            if (res.locals.json) {
                res.json(res.locals.json);
            } else {
                next();
            }
        });

        let store = require("../../config/redux/store");

        app.get('*', async function (req, res) {
            if (req.path.split("/")[3] == "embed" && req.method === 'GET') {
                res.removeHeader('X-Frame-Options');
            }

            let configBuilder = require("pluginbot/config");
            let clientPlugins = Object.keys((await configBuilder.buildClientConfig(CONFIG_PATH)).plugins);
            let {site_title, site_description, hostname} = store.getState().options;
            res.render("main", {vendor: appConfig.vendor_path, bundle : appConfig.bundle_path, plugins : clientPlugins, site_title, site_description, hostname});
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
            if (err.message == "File too large") {
                err.status = 413;
                res.locals.error = "File too large";

            }

            // send the error
            res.status(err.status || 500).json({error: res.locals.error});

            //res.render('error');
        });



    }
}