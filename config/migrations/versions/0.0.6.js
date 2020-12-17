module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("participants", table => {
            table.integer('campaign_id').references('campaigns.id');
            console.log("Updated 'participants' table.");
        });
        await knex.schema.alterTable("clicks", table => {
            table.string('location');
            table.string('ip');
            table.boolean('fraud');
            table.string('fraud_message');
            console.log("Updated 'participants' table.");
        })

        return await knex;

    },
    down : async function(knex){
        await knex.schema.alterTable("participants", table => {
            table.dropColumns('campaign_id');
        })
        await knex.schema.alterTable("clicks", table => {
            table.dropColumns('location');
            table.dropColumns('ip');
            table.dropColumns('fraud');
            table.dropColumns('fraud_message');
        })

        return await knex;
    }
}