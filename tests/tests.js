
var test = require('tape');
var string = ''
let stream = test.createStream();
stream.on('data',function(buffer){
    var part = buffer.toString();
    string += part;
});



stream.on('end',function(){
    console.log('final output ' + string);
});

var request = require('supertest');
request = request('http://localhost:3001');
let _ = require("lodash");
let enableDestroy = require('server-destroy');
require('dotenv').config({path: require("path").join(__dirname, '../env/.env')});
let log = console.log;

var config = {
    host: process.env.POSTGRES_DB_HOST,
    user: process.env.POSTGRES_DB_USER,
    password: process.env.POSTGRES_DB_PASSWORD,
    port: process.env.POSTGRES_DB_PORT,
    multipleStatements: true

};


var knex = require('knex')({
    client: 'pg',
    connection: config
});

let fs = require("fs");
let Promise = require("bluebird");

const before = test;

let token = null;
let baseHeaders = null;
let app = null;
let server = null;

let reset = function(callback){
    if(app && server) {
        server.destroy();
    }
    //todo: don't do this.. but the pool b draining
        setTimeout(function(){
            require("../config/db").destroy().then(function(res){
                console.log("POOL!", res);
                Object.keys(require.cache).forEach(function(key) { delete require.cache[key] });
                knex.raw('DROP DATABASE IF EXISTS testing')
                    .then(() => knex.raw('CREATE DATABASE testing'))
                    .then(() => require("../app"))
                    .then(function(newApp){
                        server = newApp.listen("3001");
                        enableDestroy(server);
                        app = newApp;
                        callback(true);
                }).catch(function(reason){
                    console.err(reason);
                })
            })
        }, 500)

}
let stripDates = function(body){
    let newObj = body;
    for(var i in body){
        if(i == "updated_at" || i == "created_at"){
            delete newObj[i];
        }
        else if( newObj[i] === Object(newObj[i])){
            newObj[i] = stripDates(newObj[i]);
        }
    }

    return newObj;
}
let responseHandler = function(assert, expected, test, callback){
    return function(err, res){
        if(err || (!res || !res.body)) {
            assert.error(err, "error")
            callback(err, res);
        }else{
            let body = stripDates(res.body);
            let strippedExpected = stripDates(expected);
            assert.same(body, strippedExpected, test);
            callback(null, res);
        }

    }

}
before('before', function (assert) {
    reset(function (status) {
        console.log(status);
        request.post("/api/v1/auth/token")
            .send({"email": "admin", "password": "1234"})
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                assert.error(err, "token request made")
                token = res.body.token;
                baseHeaders = {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": "JWT " + token
                };
                assert.end();

            })
    })

});


test('GET /api/v1/users', function (assert) {
    let sampleUsers = [ { customer_id: null, email: 'admin', id: 1, last_login: null, name: null, phone: null, references: { funds: [], user_roles: [ { id: 1, role_name: 'admin' } ] }, role_id: 1, status: 'active' }, { customer_id: null, email: 'user', id: 2, last_login: null, name: null, phone: null, references: { funds: [], user_roles: [ { id: 3, role_name: 'user' } ] }, role_id: 3, status: 'active' }, { customer_id: null, email: 'staff', id: 3, last_login: null, name: null, phone: null, references: { funds: [], user_roles: [ { id: 2, role_name: 'staff' } ] }, role_id: 2, status: 'active' } ];
    request.get('/api/v1/users')
        .set(baseHeaders)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(responseHandler(assert, sampleUsers, "Retrieve list of roles", function(err, res){
            assert.end();
        }))
});



test('GET all roles - /api/v1/roles', function (assert) {

    let sampleRoles = [ { id: 1, role_name: 'admin' }, { id: 2, role_name: 'staff' }, { id: 3, role_name: 'user' } ];

    request.get('/api/v1/roles')
        .set(baseHeaders)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(responseHandler(assert, sampleRoles, "Retrieve list of roles", function(err, res){
            assert.end();
        }))
});


test('GET Specific role -  /api/v1/roles/1', function (assert) {

    let sampleRoles = { id: 1, role_name: 'admin' };

    request.get('/api/v1/roles/1')
        .set(baseHeaders)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(responseHandler(assert, sampleRoles, "Retrieve specific role", function(err, res){
            assert.end();
        }))
});



test('GET all permissions -  /api/v1/permissions', function (assert) {

    let sampleRoles = [ { id: 1, permission_name: 'get_users' }, { id: 2, permission_name: 'get_users_search' }, { id: 3, permission_name: 'get_users_id' }, { id: 4, permission_name: 'put_users_id' }, { id: 5, permission_name: 'delete_users_id' }, { id: 6, permission_name: 'get_users_id_avatar' }, { id: 7, permission_name: 'put_users_id_avatar' }, { id: 8, permission_name: 'post_users_register' }, { id: 9, permission_name: 'post_users_invite' }, { id: 10, permission_name: 'get_roles' }, { id: 11, permission_name: 'post_roles' }, { id: 12, permission_name: 'get_roles_search' }, { id: 13, permission_name: 'get_roles_id' }, { id: 14, permission_name: 'put_roles_id' }, { id: 15, permission_name: 'delete_roles_id' }, { id: 16, permission_name: 'get_roles_manage_permissions' }, { id: 17, permission_name: 'post_roles_manage_permissions' }, { id: 18, permission_name: 'get_service_templates' }, { id: 19, permission_name: 'post_service_templates' }, { id: 20, permission_name: 'get_service_templates_search' }, { id: 21, permission_name: 'get_service_templates_id' }, { id: 22, permission_name: 'put_service_templates_id' }, { id: 23, permission_name: 'delete_service_templates_id' }, { id: 24, permission_name: 'get_service_templates_id_icon' }, { id: 25, permission_name: 'put_service_templates_id_icon' }, { id: 26, permission_name: 'get_service_templates_id_image' }, { id: 27, permission_name: 'put_service_templates_id_image' }, { id: 28, permission_name: 'get_service_templates_id_request' }, { id: 29, permission_name: 'put_service_templates_id_request' }, { id: 30, permission_name: 'get_service_categories' }, { id: 31, permission_name: 'post_service_categories' }, { id: 32, permission_name: 'get_service_categories_search' }, { id: 33, permission_name: 'get_service_categories_id' }, { id: 34, permission_name: 'put_service_categories_id' }, { id: 35, permission_name: 'delete_service_categories_id' }, { id: 36, permission_name: 'get_service_template_properties' }, { id: 37, permission_name: 'post_service_template_properties' }, { id: 38, permission_name: 'get_service_template_properties_search' }, { id: 39, permission_name: 'get_service_template_properties_id' }, { id: 40, permission_name: 'put_service_template_properties_id' }, { id: 41, permission_name: 'delete_service_template_properties_id' }, { id: 42, permission_name: 'get_service_instances' }, { id: 43, permission_name: 'get_service_instances_own' }, { id: 44, permission_name: 'get_service_instances_search' }, { id: 45, permission_name: 'get_service_instances_id' }, { id: 46, permission_name: 'put_service_instances_id' }, { id: 47, permission_name: 'delete_service_instances_id' }, { id: 48, permission_name: 'post_service_instances_id_approve' }, { id: 49, permission_name: 'post_service_instances_id_change_price' }, { id: 50, permission_name: 'post_service_instances_id_cancel' }, { id: 51, permission_name: 'post_service_instances_id_request_cancellation' }, { id: 52, permission_name: 'post_service_instances_id_add_charge' }, { id: 53, permission_name: 'get_service_instances_id_awaiting_charges' }, { id: 54, permission_name: 'post_service_instances_id_approve_charges' }, { id: 55, permission_name: 'post_service_instances_id_files' }, { id: 56, permission_name: 'get_service_instances_id_files' }, { id: 57, permission_name: 'delete_service_instances_id_files_fid' }, { id: 58, permission_name: 'get_service_instances_id_files_fid' }, { id: 59, permission_name: 'get_service_instance_properties' }, { id: 60, permission_name: 'post_service_instance_properties' }, { id: 61, permission_name: 'get_service_instance_properties_search' }, { id: 62, permission_name: 'get_service_instance_properties_id' }, { id: 63, permission_name: 'put_service_instance_properties_id' }, { id: 64, permission_name: 'delete_service_instance_properties_id' }, { id: 65, permission_name: 'get_service_instance_messages' }, { id: 66, permission_name: 'post_service_instance_messages' }, { id: 67, permission_name: 'get_service_instance_messages_search' }, { id: 68, permission_name: 'get_service_instance_messages_id' }, { id: 69, permission_name: 'put_service_instance_messages_id' }, { id: 70, permission_name: 'delete_service_instance_messages_id' }, { id: 71, permission_name: 'get_service_instance_cancellations' }, { id: 72, permission_name: 'post_service_instance_cancellations' }, { id: 73, permission_name: 'get_service_instance_cancellations_own' }, { id: 74, permission_name: 'get_service_instance_cancellations_search' }, { id: 75, permission_name: 'get_service_instance_cancellations_id' }, { id: 76, permission_name: 'put_service_instance_cancellations_id' }, { id: 77, permission_name: 'delete_service_instance_cancellations_id' }, { id: 78, permission_name: 'post_service_instance_cancellations_id_approve' }, { id: 79, permission_name: 'post_service_instance_cancellations_id_reject' }, { id: 80, permission_name: 'get_event_logs' }, { id: 81, permission_name: 'post_event_logs' }, { id: 82, permission_name: 'get_event_logs_search' }, { id: 83, permission_name: 'get_event_logs_id' }, { id: 84, permission_name: 'put_event_logs_id' }, { id: 85, permission_name: 'delete_event_logs_id' }, { id: 86, permission_name: 'get_email_templates' }, { id: 87, permission_name: 'post_email_templates' }, { id: 88, permission_name: 'get_email_templates_search' }, { id: 89, permission_name: 'get_email_templates_id' }, { id: 90, permission_name: 'put_email_templates_id' }, { id: 91, permission_name: 'delete_email_templates_id' }, { id: 92, permission_name: 'get_email_templates_id_roles' }, { id: 93, permission_name: 'put_email_templates_id_roles' }, { id: 94, permission_name: 'get_invoices' }, { id: 95, permission_name: 'get_invoices_own' }, { id: 96, permission_name: 'get_invoices_search' }, { id: 97, permission_name: 'get_invoices_id' }, { id: 98, permission_name: 'get_invoices_upcoming_userid' }, { id: 99, permission_name: 'post_invoices_id_refund' }, { id: 100, permission_name: 'get_system_options' }, { id: 101, permission_name: 'put_system_options' }, { id: 102, permission_name: 'get_system_options_id' }, { id: 103, permission_name: 'put_system_options_id' }, { id: 104, permission_name: 'get_system_options_file_id' }, { id: 105, permission_name: 'put_system_options_file_id' }, { id: 106, permission_name: 'post_charge_id_approve' }, { id: 107, permission_name: 'post_charge_id_cancel' }, { id: 108, permission_name: 'post_auth_token' }, { id: 109, permission_name: 'post_auth_session_clear' }, { id: 110, permission_name: 'post_auth_reset_password' }, { id: 111, permission_name: 'get_auth_reset_password_uid_token' }, { id: 112, permission_name: 'post_auth_reset_password_uid_token' }, { id: 113, permission_name: 'get_analytics_data' }, { id: 114, permission_name: 'get_analytics_properties_id' }, { id: 115, permission_name: 'get_permissions' }, { id: 116, permission_name: 'can_administrate' }, { id: 117, permission_name: 'can_manage' } ]

    request.get('/api/v1/permissions')
        .set(baseHeaders)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(responseHandler(assert, sampleRoles, "Retrieve list of Permissions", function(err, res){
            assert.end();
        }))
});



test('GET Analytics', function (assert) {


    request.get('/api/v1/analytics/data')
        .set(baseHeaders)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
            assert.end();
        })
});

test.onFinish(function(){
    setTimeout(function(){
        process.exit();
    }, 2000);

})