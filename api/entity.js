let validate = require('./middlewares/validate');
let EventLogs = require('../models/event-log');
let async = require("async");
let auth = require("./middlewares/auth");
//let store = require("../config/redux/store");

//TODO : Strip password field from getters
//todo - entity posting should have correct error handling, response should tell user what is wrong like if missing column
//todo - generify the method we use to "find all" and reduce code duplication in the getters
module.exports = function (router, model, resourceName, userCorrelator) {
    let references = model.references || [];

    if (userCorrelator) {
        router.get(`/${resourceName}/own`, auth(), function (req, res, next) {
            let key = req.query.key;
            let value = req.query.value;
            if (!key || !value) {
                key = undefined;
                value = undefined;
            }
            model.findAll(key, value, function (parents) {
                parents = parents.filter(resource => {
                    return resource.get(userCorrelator) == req.user.get("id");
                });
                if (references === undefined || references.length == 0 || parents.length == 0) {
                    res.locals.json = (parents.map(entity => entity.data));
                    next();
                }
                else {
                    async.mapSeries(parents, function(parent, callback){
                        parent.attachReferences(function(updatedParent){
                            callback(null, updatedParent);
                        })
                    },function(err, result){
                        if(err){
                            console.error("error attaching references: ", err);
                        }
                        else{
                            res.locals.json = result.map(entity => entity.data);
                            next();
                        }

                    })
                }
            });

        });
    }


    router.get(`/${resourceName}/`, auth(), function (req, res, next) {
        let key = req.query.key;
        let value = req.query.value;
        if (!key || !value) {
            key = undefined;
            value = undefined;
        }
        model.findAll(key, value, async function (parents) {
            if (references === undefined || references.length === 0 || parents.length === 0) {
                res.locals.json = parents.map(entity => entity.data);
                next();
            }
            else {
                let results = await model.batchAttatchReference(parents)
                res.locals.json = results.map(entity => entity.data);
                next();
            }
        });
    });


    router.get(`/${resourceName}/search`, auth(), function (req, res, next) {
        model.search(req.query.key, req.query.value, function (parents) {
            if (references === undefined || references.length == 0 || parents.length == 0) {
                res.locals.json = parents.map(entity => entity.data)
                next();
            }
            else {
                async.mapSeries(parents, function(parent, callback){
                    parent.attachReferences(function(updatedParent){
                        callback(null, updatedParent);
                    })
                },function(err, result){
                    if(err){
                        console.error("error attaching references: ", err);
                    }
                    else{
                        res.locals.json = result.map(entity => entity.data);
                        next();
                    }

                })
            }
        });


    });


    router.get(`/${resourceName}/:id(\\d+)`, auth(), validate(model), function (req, res, next) {
        let entity = res.locals.valid_object;
        if (references === undefined || references.length == 0) {
            res.locals.json = entity.data;
            next();
        }
        else {
            entity.attachReferences(function (updatedEntity) {
                res.locals.json = (updatedEntity.data);
                next();
            });
        }
    });

    //TODO Working for single update, need batch update method to work for children
    router.put(`/${resourceName}/:id(\\d+)`, auth(), validate(model), async function (req, res, next) {
        try {
            let entity = res.locals.valid_object;
            await model.database.transaction(async function (trx) {
                let CreateEntity = require("../models/base/entity");
                let trxEntity = CreateEntity(model.table, model.references, model.primaryKey, trx);

                entity = new trxEntity(entity.data);


                req.body.id = entity.get("id");
                Object.assign(entity.data, req.body);
                let updatedEntity = await entity.update();
                let requestReferences = req.body.references || {};

                //todo: combine updateReferences into a single transaction
                updatedEntity.data.references = {};
                for (let reference of references) {

                    let referenceData = requestReferences[reference.model.table]
                    if (referenceData) {
                        updatedEntity.data.references[reference.model.table] = await updatedEntity.updateReferences(referenceData, reference, true);
                    }
                }
                res.locals.json = updatedEntity.data;
                //store.dispatchEvent(`${model.table}_updated`, updatedEntity);
            });
            next();

        }catch(error){
            console.error("Server error updating entity: ", error);
            if(error.code == 23503){
                res.status(400).send({error : error.constraint});

            }
            res.status(500).send({error : "error updating"});
        }
    });


    router.delete(`/${resourceName}/:id(\\d+)`, auth(), validate(model), async function (req, res, next) {
        let entity = res.locals.valid_object;
        entity = await entity.attachReferences();
        entity.delete(function (err, result) {
            if(err){
                console.error("Server error deleting entity: " + err);
                res.status(500).send({ error: "Error deleting" })
            }
            else {
                //store.dispatchEvent(`${model.table}_deleted`, entity);
                res.locals.json = {message: `${resourceName} with id ${req.params.id} deleted`};
                EventLogs.logEvent(req.user.get('id'), `${resourceName} ${req.params.id} was deleted by user ${req.user.get('email')}`);
                next();
            }
        })
    });


    router.post(`/${resourceName}`, auth(), function (req, res, next) {
        let entity = new model(req.body);
        entity.create(async function (err, newEntity) {
            if(err){
                console.error("Server error creating entity: " + err);
                res.status(500).send({ error: "Error creating new " + resourceName })
            }
            else {
                if (references.length === 0 || req.body.references === undefined || Object.keys(req.body.references).length === 0) {
                    res.locals.json = newEntity.data;
                    
                    //store.dispatchEvent(`${model.table}_created`, newEntity)
                    EventLogs.logEvent(req.user.get('id'), `${resourceName} ${newEntity.get(model.primaryKey)} was created by user ${req.user.get('email')}`);
                    next();
                }
                else {
                    let requestReferenceData = req.body.references;
                    
                    newEntity.data.references = {};
                    for (let reference of references) {
                        let referenceData = requestReferenceData[reference.model.table];
                        if(referenceData) {
                            newEntity.data.references[reference.model.table] = await newEntity.updateReferences(referenceData, reference);
                        }
                        res.locals.json= newEntity.data;
                    }
                    //store.dispatchEvent(`${model.table}_created`, newEntity)
                    EventLogs.logEvent(req.user.get('id'), `${resourceName} ${newEntity.get(model.primaryKey)} was created by user ${req.user.get('email')}`);
                    next();
                }
            }
        });
    });


    return router;
};