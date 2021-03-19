var knex = require('./db');
var _ = require("lodash");
var Role = require("../models/role");
var Permission = require("../models/permission");
var SystemOption = require("../models/system-options");
let options = require("./system-options");
let User = require("../models/user");
let migrate = require("./migrations/migrate");
let swaggerJSON = require("../api-docs/api-paths.json");
//DO NOT MODIFY THE CORE SCHEMA!
//If you do, make sure you know exactly what you are doing!

//defining initial roles and
//TODO: Change the initialRoleMap to have actual permissions
let systemOptions = options.options;


let additionalPermissions = ["can_administrate", "can_manage"];

let assignPermissionPromise = function (initConfig, permission_objects, initialRoleMap) {
    return function (role) {
        return new Promise(function (resolve, reject) {
            let mapped = initialRoleMap[role.get("role_name")];
            let perms_to_assign = permission_objects.filter(p => mapped.includes(p.get("permission_name")));
            role.assignPermission(perms_to_assign, function (result) {
                //initializes demo data
                if (role.get("role_name") == "admin" && initConfig && initConfig.admin_user && initConfig.admin_password) {
                    //insert user in config
                    console.log("admin!", role);
                    let admin = new User({
                        email: initConfig.admin_user,
                        password: require("bcryptjs").hashSync(initConfig.admin_password, 10),
                        role_id: role.get("id")
                    });
                    admin.createUser(function (err, result) {
                        console.log("ADMIN USER CREATED!");
                        resolve("done creating admin")
                        admin.set("role_id", role.get("id"));
                        admin.update(function (finished) {

                        })
                    })
                } else {
                    resolve(role);
                }
            });
        }).then(function () {
            //Assign all system settings
            return new Promise(function (resolve, reject) {
                let options = [
                    {"option": "company_name", "value": initConfig.company_name},
                    {"option": "company_address", "value": initConfig.company_address},
                    {"option": "company_phone_number", "value": initConfig.company_phone_number},
                    {"option": "company_email", "value": initConfig.company_email}
                ];
                SystemOption.batchUpdate(options, function (result) {
                    console.log(result);
                    return resolve('Completed!');
                })
            });
        })
    }
};

//Creating initial user tables:
module.exports = function (initConfig) {
    return knex("pg_catalog.pg_tables").select("tablename").where("schemaname", "public").then(async function (exists) {
        //knex.schema.hasTable('user_card').then(function(exists){
        //If the tables specified dont exist:
        if (exists.length == 0) {
            console.log("User tables don't exist - Creating tables...");
            await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
            return knex.schema.createTable('user_roles', function (table) {
                table.increments();
                table.string('role_name').unique();
                table.timestamps(true, true);
                console.log("Created 'user_roles' table.");

            }).createTable('user_permissions', function (table) {
                table.increments();
                table.string('permission_name').unique();
                table.timestamps(true, true);
                console.log("Created 'user_permissions' table.");

            }).createTable('roles_to_permissions', function (table) {
                table.increments();
                table.integer('role_id').references('user_roles.id').onDelete('cascade');
                table.integer('permission_id').references('user_permissions.id').onDelete('cascade');
                table.timestamps(true, true);
                console.log("Created 'roles_to_permissions' table.");

            }).createTable('users', function (table) {
                table.increments();
                table.integer('role_id').references('user_roles.id');
                table.uuid('account_id').defaultTo(knex.raw('uuid_generate_v4()'));
                table.string('name');
                table.string('email').notNullable().unique();
                table.string('password');
                table.enu('status', ['active', 'suspended', 'invited', 'flagged', 'disconnected']).defaultTo('active');
                table.string('phone');
                table.timestamp('last_login');
                table.timestamps(true, true);
                console.log("Created 'users' table.");

            }).createTable('campaign_categories', function (table) {
                table.increments();
                table.string('name');
                table.string('description');
                table.timestamps(true, true);
                console.log("Created 'campaign_categories' table.");
            }).createTable('campaigns', function (table) {
                table.increments();
                table.integer('user_id').references('users.id').onDelete('cascade');
                table.integer('category_id').references('campaign_categories.id');
                table.string('name');
                table.string('description');
                table.enu('reward_type', ['cash_reward', 'discount', 'discount_coupon', 'points','free_subscription']).defaultTo('cash_reward');
                table.enu('commission_type', ['fixed', 'percentage_sale']).defaultTo('fixed');
                //table.enu('reward', ['reward_percentage', 'reward_amount']);
                table.string('reward');
                table.boolean('private_campaign');
                table.bigInteger('reward_price');
                table.boolean('auto_approve').defaultTo(true);
                table.integer('cookie_life');
                table.boolean('published').defaultTo(false);
                table.enu('payout_terms', ['NET30', 'NET15','NET20']).defaultTo('NET30');
                table.bigInteger('minimum_cash_payout');
                table.integer('trial_period_days');
                table.boolean('enable_recurring').defaultTo(false);
                table.integer('recurring_limit');
                table.string('recurring_end_date');
                table.timestamps(true, true);
                console.log("Created 'campaigns' table.");

            }).createTable('participants', function (table) {
                table.increments();
                table.integer('created_by').references('users.id');
                table.integer('approved_by').references('users.id');
                table.integer('campaign_id').references('campaigns.id');
                table.string('name');
                table.string('fname');
                table.string('lname');
                table.jsonb('metadata');
                table.string('email').notNullable().unique();
                table.string('referral_code').notNullable().unique();
                table.string('password');
                table.enu('status', ['active', 'inactive', 'suspended', 'invited', 'disconnected']).defaultTo('active');
                table.bigInteger('awaiting_payout');
                table.bigInteger('total_payout');
                table.timestamps(true, true);
                console.log("Created 'services_templates' table.");

            }).createTable('invitations', function (table) {
                table.increments();
                table.string('token');
                table.integer('user_id').references('users.id').onDelete('cascade');
                table.integer('participant_id').references('participants.id');
                table.timestamps(true, true);
                console.log("Created 'invitations' table.");

            }).createTable('system_options', function (table) {
                table.string('option').primary();
                table.string('value');
                table.boolean("public").defaultTo(false);
                table.string('type');
                table.string('data_type');
                table.timestamps(true, true);
                console.log("Created 'system_options' table.");

            }).createTable('event_logs', function (table) {
                table.increments();
                table.integer('user_id');
                table.string('log_level');
                table.string('log_type');
                table.string('log');
                table.timestamps(true, true);
                console.log("Created 'event_logs' table.");

            }).createTable('notification_templates', function (table) {
                table.increments();
                table.integer('campaign_id').references('campaigns.id');
                table.string('name');
                table.string('event_name');
                table.text('message', 'longtext');
                table.string('subject');
                table.string("model");
                table.specificType('additional_recipients', 'text[]');
                table.boolean("send_email").defaultTo(false);
                table.boolean("send_to_owner").defaultTo(true);
                table.boolean("create_notification").default(true);
                table.timestamps(true, true);
                console.log("Created 'notification_templates' table.");

            }).createTable("notification_templates_to_roles", function (table) {
                table.increments();
                table.integer("notification_template_id").references("notification_templates.id");
                table.integer("role_id").references("user_roles.id");
                table.timestamps(true, true);
                console.log("Created 'notification_templates_to_roles' table.");

            }).createTable('notifications', function (table) {
                table.increments();
                table.integer('participant_id').references('participants.id').onDelete('cascade');
                table.string("source_id").unique();
                table.text('message', 'longtext');
                table.string("type");
                table.integer("user_id").references("users.id").onDelete('cascade');
                table.string("subject");
                table.boolean("read").defaultTo(false);
                table.timestamp('created_at').defaultTo(knex.fn.now());
                console.log("created notifications table");

            }).createTable('customers', function (table) {
                table.increments();
                table.integer('participant_id').references('participants.id');
                table.integer('campaign_id').references('campaigns.id');
                table.boolean('underReview').defaultTo(false);
                table.jsonb('metadata');
                table.string('customer_id').unique();
                table.string('ip');
                table.string('email');
                table.string('name');
                table.timestamp('last_login');
                table.timestamps(true, true);
                console.log("Created 'customers' table.");

            }).createTable('commissions', function (table) {
                table.increments();
                table.integer('participant_id').references('participants.id');
                table.integer('campaign_id').references('campaigns.id');
                table.integer('customer_id').references('customers.id');
                table.jsonb('metadata');
                table.bigInteger('earnings');
                table.integer('conversion_id').references('conversions.id');
                table.bigInteger('conversion_amount');
                table.bigInteger('amount');
                table.string('commission_type');
                table.string('currency').defaultTo('usd');
                table.boolean('payout').defaultTo(false);
                table.enu('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
                table.timestamps(true, true);
                console.log("Created 'commissions' table.");

            }).createTable('clicks', function (table) {
                table.increments();
                table.integer('participant_id').references('participants.id');
                table.integer('campaign_id').references('campaigns.id');
                table.integer('customer_id').references('customers.id');
                table.jsonb('metadata');
                table.string('url');
                table.string('location');
                table.string('ip');
                table.boolean('fraud');
                table.string('fraud_message');
                table.timestamps(true, true);
                console.log("Created 'clicks' table.");

            }).createTable('properties', function (table) {
                table.increments();
                table.string('name');
                table.string('value');
                table.string('prop_class');
                table.string('prop_label');
                table.string('prop_description');
                table.timestamps(true, true);
                console.log("Created 'properties' table.");

            }).createTable('urls', function (table) {
                table.increments();
                table.integer('user_id').references('users.id');
                table.integer('campaign_id').references('campaigns.id');
                table.string('shortned_url');
                table.string('original_url');
                table.integer('fb_shares');
                table.integer('twitter_shares');
                table.integer('email_shares');
                table.integer('linkedin_shares');
                table.integer('whatsapp_shares');
                table.timestamps(true, true);
                console.log("Created 'urls' table.");

            }).createTable('invoices', function (table) {
                table.increments();
                table.integer('user_id').references('users.id');
                table.integer('campaign_id').references('campaigns.id');
                table.string('invoice_id').unique();
                table.string('description');
                table.float('amount_due');
                table.boolean('closed');
                table.string('currency');
                table.boolean('forgiven');
                table.bigInteger('date');
                table.boolean('paid');
                table.bigInteger('period_end');
                table.bigInteger('period_start');
                table.string('receipt_number');
                table.float('starting_balance');
                table.float('ending_balance');
                table.float('total');
                table.boolean('livemode');
                table.timestamps(true, true);
                console.log("Created 'invoices' table.");

            }).createTable('invoice_lines', function (table) {
                table.increments();
                table.integer('invoice_id').references('invoices.id').onDelete('cascade');
                table.string('line_item_id');
                table.float('amount');
                table.string('currency');
                table.string('description');
                table.string('type');
                table.boolean('livemode');
                table.timestamps(true, true);
                console.log("Created 'invoice_lines' table.");

            }).createTable('transactions', function (table) {
                table.increments();
                table.integer('invoice_id').references('invoices.id').onDelete('cascade');
                table.integer('user_id').references('users.id');
                table.string('charge_id');
                table.string('invoice');
                table.float('amount');
                table.boolean('captured');
                table.string('currency');
                table.string('dispute');
                table.boolean('paid');
                table.string('description');
                table.string('failure_code');
                table.string('failure_message');
                table.string('statement_descriptor');
                table.string('status');
                table.boolean('livemode');
                table.timestamps(true, true);
                console.log("Created 'transactions' table.");

            }).createTable('password_reset_request', function (table) {
                table.increments();
                table.integer('user_id').references('users.id').onDelete('cascade');
                table.integer('participant_id').references('participants.id').onDelete('cascade');
                table.string('hash');
                table.timestamps(true, true);
                console.log("Created 'password_reset_request' table.");
            }).createTable('campaign_properties', function (table) {
                table.inherits('properties');
                table.increments();
                table.integer('parent_id').references('campaigns.id').onDelete('cascade');
                table.boolean('private').defaultTo(false);
                table.boolean('prompt_user').defaultTo(true);
                table.boolean('required').defaultTo(false);
                table.string('prop_input_type');
                table.specificType('prop_values', 'text[]');
                table.string('option');
                table.string('value');
                table.string('data_type');
                table.timestamps(true, true);
            }).createTable('conversions', function (table) {
                table.increments();
                table.integer('campaign_id').references('campaigns.id');
                table.integer('participant_id').references('participants.id');
                table.integer('customer_id').references('customers.id');
                table.string('order_id');
                table.string('affiliation');
                table.bigInteger('amount');
                table.jsonb('metadata');
                table.string('coupon');
                table.string('currency');
                table.timestamps(true, true);
            }).createTable('rewards', function (table) {
                table.increments();
                table.integer('campaign_id').references('campaigns.id');
                table.integer('participant_id').references('participants.id');
                table.integer('conversion_id').references('conversions.id');
                table.string('type');
                table.string('affiliation');
                table.date('dateGiven');
                table.date('dateExpires');
                table.date('dateCancelled');
                table.date('dateScheduledFor');
                table.boolean('cancellable');
                table.enu('source', ['referred', 'manual']).defaultTo('referred');
                table.string('unit');
                table.string('name');
                table.bigInteger('assignedCredit');
                table.bigInteger('redeemedCredit');
                table.string('currency');
                table.timestamps(true, true);
            }).createTable('redemptions', function (table) {
                table.increments();
                table.integer('reward_id').references('rewards.id');
                table.date('dateRedeemed');
                table.bigInteger('quantityRedeemed');
                table.timestamps(true, true);
            }).createTable('webhooks', function (table) {
                table.increments();
                table.integer('campaign_id').references('campaigns.id');
                table.string('endpoint_url').unique().notNullable();
                table.string("health");
                table.boolean("async_lifecycle").notNullable().defaultTo(true);
                table.timestamps(true, true);
            }).createTable('campaign_system_options', function (table) {
                table.increments();
                table.integer('campaign_id').references('campaigns.id');
                table.string('option');
                table.string('value');
                table.boolean("public").defaultTo(false);
                table.string('type');
                table.string('data_type');
                table.timestamps(true, true);
                console.log("Created 'campaign_system_options' table.");
            }).createTable('files', function (table) {
                table.increments();
                table.integer('campaign_id').references('campaigns.id').onDelete('cascade');
                table.string('url');
                table.string('public_id');
                table.string('file_name');
                table.string('name');
                table.timestamps(true, true);
                console.log("Created 'files' table.");
                console.log("***** All Tables successfully created *****");
            });
        }
        return false;

        //initialize permissions and users
    }).then(function (isInit) {
        return new Promise(function (resolve, reject) {
            if (!isInit) {
                //ensure required system-options exist in database
                console.log("database initialized - checking to see if system-options exist")
                options.populateOptions(systemOptions).then((result) => {
                    console.log(result);
                    resolve(false);
                });
            } else {
                let initialRoleMap = {
                    "admin": [],
                    "staff": [],
                    "developer": []
                };
                let permissions = [];
                for (let route in swaggerJSON) {
                    for (let method in swaggerJSON[route]) {
                        if (swaggerJSON[route][method]['x-roles'].includes("admin")) {
                            initialRoleMap.admin.push(swaggerJSON[route][method].operationId);
                        }
                        if (swaggerJSON[route][method]['x-roles'].includes("staff")) {
                            initialRoleMap.staff.push(swaggerJSON[route][method].operationId);
                        }
                        if (swaggerJSON[route][method]['x-roles'].includes("developer")) {
                            initialRoleMap.developer.push(swaggerJSON[route][method].operationId);
                        }
                        if (swaggerJSON[route][method]['x-roles'].includes("developer")) {
                            initialRoleMap.developer.push(swaggerJSON[route][method].operationId);
                        }
                        permissions.push(swaggerJSON[route][method].operationId);
                    }
                }

                let roles = Object.keys(initialRoleMap);

                //add additional permissions
                additionalPermissions.forEach(function (element) {
                    permissions.push(element);
                    initialRoleMap.admin.push(element);
                    if (element === 'can_manage') {
                        initialRoleMap.staff.push(element);
                        initialRoleMap.developer.push(element);
                    }
                });

                let permission_data = permissions.map(permission => ({"permission_name": permission}));
                let role_data = roles.map(role => ({"role_name": role}));

                    //create roles
                    Role.batchCreate(role_data, function (roles) {
                        //get the User role id for default_user_role
                        let userRole = roles.filter(role => role['role_name'] == 'staff')[0];
                        systemOptions.push({
                            "option": "default_user_role",
                            public: false,
                            "type": "system",
                            "data_type": "number",
                            "value": userRole['id']
                            }
                        );
                        //create options
                        SystemOption.batchCreate(systemOptions, function (optionResult) {

                            //create role objects from results of inserts
                            let role_objects = roles.map(role => new Role(role));

                            //create permissions
                            Permission.batchCreate(permission_data, function (result) {

                                //create permission objects from results of inserts
                                let permission_objects = result.map(permission => new Permission(permission));

                                //assign permissions to roles
                                resolve(Promise.all(role_objects.map(assignPermissionPromise(initConfig, permission_objects, initialRoleMap))).then(function (roles) {
                                    //IMPORTANT: uncomment the line below if you want the installation with the test demo data.
                                    //return require("../tests/demo");
                                }));
                            });
                        });
                    });
            }
        }).then(migrate());
    });
};