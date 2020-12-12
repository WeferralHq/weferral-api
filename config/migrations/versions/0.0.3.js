module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("campaigns", table => {
            table.string('reward');
            table.boolean('private_campaign');
            table.boolean('auto_approval');
            console.log("Updated 'campaigns' table.");
        });
        await knex.schema.alterTable("notification_templates", table => {
            table.integer('campaign_id').references('campaigns.id');
        });

        return await knex;

    },
    down : async function(knex){
        await knex.schema.alterTable("campaigns", table => {
            table.dropColumns('reward');
            table.dropColumns('private_campaign');
            table.dropColumns('auto_approval');
        })
        await knex.schema.alterTable("notification_templates", table => {
            table.dropColumns('campaign_id');
        })

        return await knex;
    }
}