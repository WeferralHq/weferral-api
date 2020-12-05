module.exports = {
    up : async function(knex){
        await knex.schema.createTable("campaign_properties", table => {
            //Inherits the properties table.
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
            console.log("Created 'campaign_properties' table.");
        });

        return await knex;

    },
    down : async function(knex){
        await knex.schema.dropTable("campaign_properties")

        return await knex;
    }
}