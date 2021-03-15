module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("campaigns", table => {
            table.bigInteger('recurring_end_date');
            console.log("Updated 'campaigns' table.");
        });

        return await knex;

    },
    down : async function(knex){
        await knex.schema.alterTable("campaigns", table => {
            table.dropColumns('recurring_end_date');
        });

        return await knex;
    }
}