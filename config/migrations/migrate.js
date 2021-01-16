let knex = require("../db");
let semver = require("semver")
let semver_sort = require("semver-sort")
let glob = require("glob");
let Promise = require("bluebird");
let SystemOptions = require("../../models/system-options");
let pjson = require('../../package.json');




async function migrate(){
    let migrations = await getMigrations()
    let appVersion = pjson.version;
    console.log(migrations);
    console.log(appVersion);
    let order = semver_sort.asc(Object.keys(migrations))
    let migrationStart = order.findIndex((migrationVersion) => { return semver.gt(migrationVersion, appVersion)})
    if(migrationStart == -1){
        console.log("db current - no migrations needed")
        return Promise.resolve();
    }
    let migrationsToPerform = order.slice(migrationStart);
    return knex.transaction(trx => {
        return Promise.mapSeries(migrationsToPerform, (migration) => {
            return migrations[migration].up(trx)
        })
    }).then(result => {
        return new Promise(resolve => {
            console.log("migration complete - switching app version to latest");
            console.log(result);
            pjson.version = order.pop();
            SystemOptions.findOne("option", "app_version", (version => {
                version.set("value", order.pop());
                version.update(result => {resolve(result)});
            }))
        })
    }).catch(err => {
        console.error(err)
    })
}
function getMigrations(){
    return new Promise((resolve, reject) => {
        glob(require("path").join(__dirname, './versions/*.js'), (err, files) => {
            let migrationVersions = files.reduce((acc, file) => {
                console.log(file);
                let version = file.split("/").pop().slice(0, -3);
                 acc[version] = require(file);
                 return acc;
            },{});
            resolve(migrationVersions);
        })
    })
}

module.exports = migrate;

