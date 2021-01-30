module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("commissions", table => {
            table.enu('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
            console.log("Updated 'commissions' table.");
        });
        await knex.schema.alterTable("campaigns", table => {
            table.integer('trial_period_days');
            table.boolean('enable_recurring').defaultTo(false);
            table.integer('recurring_limit');
            console.log("Updated 'campaigns' table.");
        });
        await knex.schema.createTable("files", table => {
            table.increments();
            table.integer('campaign_id').references('campaigns.id').onDelete('cascade');
            table.string('url');
            table.integer('public_id');
            table.string('name');
            table.timestamps(true, true);
            console.log("Created 'files' table.");
        });

        return await knex;

    },
    down : async function(knex){
        await knex.schema.alterTable("commissions", table => {
            table.dropColumns('status');
        });
        await knex.schema.alterTable("campaigns", table => {
            table.dropColumns('trial_period_days');
        });
        await knex.schema.dropTable("files");

        return await knex;
    }
}