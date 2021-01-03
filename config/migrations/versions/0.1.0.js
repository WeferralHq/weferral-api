module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("participants", table => {
            table.jsonb('company');
            table.jsonb('address');
            console.log("Updated 'participants' table.");
        });
        await knex.schema.createTable("campaign_system_options", table => {
            table.increments();
            table.integer('campaign_id').references('campaigns.id');
            table.string('option');
            table.string('value');
            table.boolean("public").defaultTo(false);
            table.string('type');
            table.string('data_type');
            table.timestamps(true, true);
            console.log("Created 'campaign_system_options' table.");
        });

        return await knex;

    },
    down : async function(knex){
        await knex.schema.alterTable("participants", table => {
            table.dropColumns('company');
            table.dropColumns('address');
        });

        return await knex;
    }
}