module.exports = {
    up : async function(knex){
        await knex.schema.createTable("conversions", table => {
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
            console.log("Created 'conversions' table.");
        });
        await knex.schema.createTable("rewards", table => {
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
        });

        await knex.schema.createTable("redemptions", table => {
            table.increments();
            table.integer('reward_id').references('rewards.id');
            table.date('dateRedeemed');
            table.bigInteger('quantityRedeemed');
            table.timestamps(true, true);
        });
        await knex.schema.alterTable("commissions", table => {
            table.integer('conversion_id').references('conversions.id');
            table.bigInteger('conversion_amount');
            table.bigInteger('amount');
            table.string('commission_type');
            table.string('currency').defaultTo('usd');
            table.boolean('payout').defaultTo(false);
            console.log("Updated 'commissions' table.");
        });
        await knex.schema.createTable("webhooks", table => {
            table.increments();
            table.integer('campaign_id').references('campaigns.id');
            table.string('endpoint_url').unique().notNullable();
            table.string("health");
            table.boolean("async_lifecycle").notNullable().defaultTo(true);
            table.timestamps(true, true);
            console.log("Created 'webhooks ' table.");
        });

        return await knex;

    },
    down : async function(knex){
        await knex.schema.dropTable("conversions")
        await knex.schema.dropTable("rewards")
        await knex.schema.dropTable("redemptions")
        await knex.schema.alterTable("commissions", table => {
            table.dropColumns('conversion_id');
            table.dropColumns('conversion_amount');
            table.dropColumns('amount');
            table.dropColumns('commission_type');
            table.dropColumns('currency');
            table.dropColumns('payout');
        });
        await knex.schema.dropTable("webhooks");

        return await knex;
    }
}