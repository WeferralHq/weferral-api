module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("campaigns", table => {
            table.jsonb('reward');
            console.log("Updated 'campaigns' table.");
        });

        return await knex;

    },
    down : async function(knex){
        await knex.schema.alterTable("campaigns", table => {
            table.dropColumns('reward');
        })

        return await knex;
    }
}