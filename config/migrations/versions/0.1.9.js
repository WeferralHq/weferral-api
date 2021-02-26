module.exports = {
    up : async function(knex){
        await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        await knex.schema.alterTable("users", table => {
            table.uuid('account_id').defaultTo(knex.raw('uuid_generate_v4()'));
            console.log("Updated 'users' table.");
        });

        return await knex;

    },
    down : async function(knex){
        await knex.schema.alterTable("users", table => {
            table.dropColumns('account_id');
        });

        return await knex;
    }
}