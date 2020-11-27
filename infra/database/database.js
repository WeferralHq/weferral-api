let initializeDB = require("./initialize");
let {call, put} = require("redux-saga/effects")


let tablesExist = async function(database){
    return (await database("pg_catalog.pg_tables").select("tablename").where("schemaname", "public")).length === 0;
}


module.exports = {
    run : function*( provide ){
        let initialConfig = null;
        let dbConfig = {
            host: process.env.POSTGRES_DB_HOST,
            user: process.env.POSTGRES_DB_USER,
            database: process.env.POSTGRES_DB_NAME,
            password: process.env.POSTGRES_DB_PASSWORD,
            port: process.env.SMTP_PORT
        };

        //this is so bigints are parsed properly...
        var pg = require('pg')
        pg.types.setTypeParser(20, 'text', parseInt)

        let database = require('knex')({
            client: 'pg',
            connection: dbConfig
        });

        let isPristine = yield call(tablesExist, database);
        if(isPristine){
            console.log("DB EMPTY");
            yield call(initializeDB, database);
            console.log("Tables created - now populating with data");
            //yield call(populateDB, database);
            console.log("Initialization complete!!!!!");
        }else{

            //todo: move this to a plugin
            let migrate = require("./migrations/migrate");
            yield call(migrate, database);
            //todo : implement new system options?
            //check migrate
            //check new system options?
        }

        database.createTableIfNotExist = function(tableName, knexCreateTable, db=database){
            return db.schema.hasTable(tableName).then(function(exists){
                if(!exists){
                    return db.schema.createTable(tableName, knexCreateTable);
                }else{
                    console.log("Table: " + tableName + " Already Exists, no need to create")
                    return false;
                }
            })
        };

        yield provide({database});




    }
}