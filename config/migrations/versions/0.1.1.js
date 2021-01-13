module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("participants", table => {
            table.timestamp('last_login');
            console.log("Updated 'participants' table.");
        });

        return await knex;

    },
    down : async function(knex){
        await knex.schema.alterTable("participants", table => {
            table.dropColumns('last_login');
        });

        return await knex;
    }
}