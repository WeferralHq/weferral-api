#!/usr/bin/env node

/**
 * Module dependencies.
 */
let async = require('async');
let fs = require("fs");
let path =require("path");
let enableDestroy = require('server-destroy');

let startApp = function(app, callback=null){
    let debug = require('debug')('testpassport:server');
    let https = require('https');
    let http = require('http');

    /**
     * Get port from environment and store in Express.
     */

    let port = normalizePort(process.env.PORT || '3001');
    app.set('port', port);

    /**
     * Create HTTP server.
     */
    let config = {}
    if(process.env.CERTIFICATES){
        var key = fs.readFileSync(process.env.CERTIFICATES + "weferral.key");
        var cert = fs.readFileSync(process.env.CERTIFICATES + "weferral.crt");
        var ca = fs.readFileSync(process.env.CERTIFICATES + "weferral_bundle.crt");
        config = {key:key, cert:cert, ca:ca};
    }
    let server = http.createServer(app);
    let httpsServer = https.createServer(config, app);
    httpsServer.listen(3000);
    httpsServer.on('error', onError);
    httpsServer.on('listening', onListening);

    /**
     * Listen on provided port, on all network interfaces.
     */

    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
    if(callback){
        enableDestroy(server);
        callback(app, server);
    }

    /**
     * Normalize a port into a number, string, or false.
     */

    function normalizePort(val) {
        let port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }

        return false;
    }

    /**
     * Event listener for HTTP server "error" event.
     */

    function onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        let bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * Event listener for HTTP server "listening" event.
     */

    function onListening() {
        let addr = server.address();
        let bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        console.log('Listening on ' + bind);
    }
};

    if(!fs.existsSync(path.join(__dirname, '../env/.env'))){
        //check to see if environment variables declared...
        let conf = {
            "db_user": process.env.POSTGRES_DB_USER,
            "db_host": process.env.POSTGRES_DB_HOST,
            "db_name" : process.env.POSTGRES_DB_NAME,
            "db_password" : process.env.POSTGRES_DB_PASSWORD,
            "db_port" : process.env.POSTGRES_DB_PORT,
            "admin_user" : process.env.ADMIN_USER,
            "admin_password" : process.env.ADMIN_PASSWORD,
            "app_port" : process.env.PORT || 3000
        };

        //if env variables all declared, build env and start app
        if(Object.values(conf).every(evar => evar != null)){
            console.log("environment declared but app not installed - installing application");
            require("../bin/setup")(conf, function(env){
                require("../app")(conf).then(startApp);
            });

        //else we wait for user to send route with config data
        }else {

            //todo:  move init into setup procedure... probably lot of work...
            //todo: move this part into a file....
            //todo: move routes into a route file...
            console.log("environment not initialized - waiting for installation request")
            let express = require('express')
            let bodyParser = require('body-parser');

            let app = express()
            app.use(bodyParser.json());
            app.use(bodyParser.urlencoded({
                extended: false
            }));
            let api = express.Router();

            app.get('/', function (req, res, next) {
                if (req.url === '/setup') {
                    console.log(req.url);
                    next();
                } else {
                    res.redirect('/setup');
                }
            });

            app.use(express.static(path.join(__dirname, '../public')));

            //this routes all requests to serve index
            // view engine setup
            app.set('views', path.join(__dirname, 'views'));

            let server = app.listen((process.env.PORT || 3001), function () {
            });
            enableDestroy(server);

            api.post("/api/v1/check-db", function(req,res,next){
                let dbconfig = req.body;

                //Null Check
                if(!dbconfig.db_host || !dbconfig.db_user || !dbconfig.db_name || !dbconfig.db_password) {
                    res.status(400).json({error: "Database values are required!"});
                }

                let config = {
                    host: dbconfig.db_host,
                    user: dbconfig.db_user,
                    database: dbconfig.db_name,
                    password: dbconfig.db_password,
                    port: dbconfig.db_port
                };
                let knex = require('knex')({
                    client: 'pg',
                    connection: config
                });
                knex.raw('select 1+1 as result').then(function () {
                    knex("pg_catalog.pg_tables").select("tablename").where("schemaname", "public").then(function (exists) {
                        if(exists.length > 0){
                            res.status(200).json({message: "Connected to an Existing Database", empty: false})

                        }else{
                            res.status(200).json({message: "Connected to Empty Database", empty: true})

                        }
                    });
                }).catch(function(err){
                    res.status(400).json({error: "Invalid Database: " + err.toString()});
                });
            });

            app.use(api);

            app.post("/setup", function (req, res, next) {
                let conf = req.body;

                if(!conf.admin_user || !conf.admin_password || !conf.company_name || !conf.company_email){
                    return res.status(400).json({error: 'All fields are required'});
                }

                try {
                    require("../bin/setup")(conf, function (env) {
                        res.json({"message": "setup-initialized"});
                        server.destroy();
                        require("../app")(conf).then(startApp);
                    });
                }catch(e){
                    res.json({"error": "Error - " + e});
                }
            });
            app.get('/setup', function (request, response) {
                response.sendFile(path.resolve(__dirname, '../public', 'index.html'))
            });
        }
    }else{
      console.log("existing environment detected - starting app");
        require('dotenv').config();

            require('../app')({}).then(startApp)
    }