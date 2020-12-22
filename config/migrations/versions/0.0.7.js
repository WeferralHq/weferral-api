module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("customers", table => {
            table.string('unique_id');
            table.string('email');
            table.string('name');
            console.log("Updated 'customers' table.");
        });
        return await knex;
    },
    down : async function(knex){
        await knex.schema.alterTable("customers", table => {
            table.dropColumns('unique_id');
            table.dropColumns('email');
            table.dropColumns('name');
        })

        return await knex;
    }
}