let {call, put} = require("redux-saga/effects");
let createTable = function (knex) {
    return async function (tableName, tableFunction) {
        let table = await knex.schema.createTable(tableName, tableFunction);
        console.log("Created table : " + tableName);
        return table
    }

}

let buildTables = async function (knex) {

    console.log("Creating tables...");
    let create = createTable(knex);

    await create('user_roles', function (table) {
        table.increments();
        table.string('role_name').unique();
        table.timestamps(true, true);

    });

    await create('user_permissions', function (table) {
        table.increments();
        table.string('permission_name').unique();
        table.timestamps(true, true);

    });
    await create('roles_to_permissions', function (table) {
        table.increments();
        table.integer('role_id').references('user_roles.id').onDelete('cascade');
        table.integer('permission_id').references('user_permissions.id').onDelete('cascade');
        table.timestamps(true, true);

    });

    await create('users', function (table) {
        table.increments();
        table.integer('role_id').references('user_roles.id');
        table.string('name');
        table.string('email').notNullable().unique();
        table.string('password');
        table.string('provider').defaultTo("local");
        table.enu('status', ['active', 'suspended', 'invited', 'disconnected']).defaultTo('active');
        table.string('phone');
        table.timestamp('last_login');
        table.timestamps(true, true);
    });

    await create('products', function (table) {
        table.increments();
        table.integer('user_id').references('users.id');
        table.string('name');
        table.string('description');
        table.string('image_url');
        table.string('product_url');
        table.text('details', 'longtext');
        table.bigInteger('price');
        table.string('currency').defaultTo('usd');
        table.timestamps(true, true);
    })

    await create('campaigns', function (table) {
        table.increments();
        table.integer('user_id').references('users.id');
        table.integer('product_id').references('products.id');
        table.string('name');
        table.string('description');
        table.enu('reward_type', ['cash_reward', 'discount', 'discount_coupon', 'points','free_subscription']).defaultTo('cash_reward');
        table.enu('commission_type', ['fixed', 'percentage_sale']).defaultTo('fixed');
        table.enu('reward', ['reward_percentage', 'reward_amount']);
        table.bigInteger('reward_price');
        table.boolean('auto_approve').defaultTo(true);
        table.integer('cookie_life');
        table.boolean('published').defaultTo(false);
        table.enu('payout_terms', ['NET30', 'NET15','NET20']).defaultTo('NET30');
        table.bigInteger('minimum_cash_payout');
        table.timestamps(true, true);
    });

    await create('referrals', function (table) {
        table.increments();
        table.integer('user_id').references('users.id');
        table.string('name');
        table.string('email').notNullable().unique();
        table.string('referral_code').notNullable().unique();
        table.string('password');
        table.enu('status', ['active', 'suspended', 'invited', 'disconnected']).defaultTo('active');
        table.bigInteger('awaiting_payout');
        table.bigInteger('total_payout');
        table.timestamps(true, true);
    });
    await create('commissions', function (table) {
        table.increments();
        table.integer('referral_id').references('referrals.id');
        table.integer('campaign_id').references('campaigns.id');
        table.jsonb('metadata');
        table.bigInteger('earnings');
        table.timestamps(true, true);
    });
    await create('clicks', function (table) {
        table.increments();
        table.integer('referral_id').references('referrals.id');
        table.integer('campaign_id').references('campaigns.id');
        table.jsonb('metadata');
        table.string('url');
        table.timestamps(true, true);
    });
    await create('urls', function (table) {
        table.increments();
        table.integer('user_id').references('users.id');
        table.string('shortned_url');
        table.string('original_url');
        table.timestamps(true, true);
    });
    await create('customers', function (table) {
        table.increments();
        table.integer('referral_id').references('referrals.id');
        table.integer('campaign_id').references('campaigns.id');
        table.jsonb('metadata');
        table.timestamps(true, true);
    });
    await create('notification_templates', function (table) {
        table.increments();
        table.integer('campaign_id').references('campaigns.id');
        table.string('name');
        table.string('event_name');
        table.text('message', 'longtext');
        table.string('subject');
        table.string('description');
        table.string("model");
        table.specificType('additional_recipients', 'text[]');
        table.boolean("send_email").defaultTo(false);
        table.boolean("send_to_owner").defaultTo(true);
        table.boolean("create_notification").default(true);
        table.timestamps(true, true);

    });
    await create("notification_templates_to_roles", function (table) {
        table.increments();
        table.integer("notification_template_id").references("notification_templates.id");
        table.integer("role_id").references("user_roles.id");
        table.timestamps(true, true);

    });
    await create('notifications', function (table) {
        table.increments();
        table.string("source_id").unique();
        table.text('message', 'longtext');
        table.string("type");
        table.integer("user_id").references("users.id").onDelete('cascade');
        table.string("subject");
        table.string("affected_versions").defaultTo("*");
        table.boolean("read").defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());

    });
    await create('password_reset_request', function (table) {
        table.increments();
        table.integer('user_id').references('users.id').onDelete('cascade');
        table.string('hash');
        table.timestamps(true, true);
    });

    await create('event_logs', function (table) {
        table.increments();
        table.integer('user_id');
        table.string('log_level');
        table.string('log_type');
        table.string('log');
        table.timestamps(true, true);

    });
    await create('system_options', function (table) {
        table.string('option').primary();
        table.string('value');
        table.boolean("public").defaultTo(false);
        table.string('type');
        table.string('data_type');
        table.timestamps(true, true);

    });

    console.log("***** All Tables successfully created *****");
};

module.exports = function* (database) {
    yield call(buildTables, database);
};