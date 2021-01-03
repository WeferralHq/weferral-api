module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("participants", table => {
            table.jsonb('company');
            table.jsonb('address');
            console.log("Updated 'participants' table.");
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