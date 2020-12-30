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

        return await knex;

    },
    down : async function(knex){
        await knex.schema.dropTable("purchase")
        await knex.schema.dropTable("rewards")
        await knex.schema.dropTable("redemptions")

        return await knex;
    }
}