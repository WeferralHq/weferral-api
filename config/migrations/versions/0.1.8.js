module.exports = {
    up : async function(knex){
        await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        
        await knex.schema.alterTable("customers", table => {
            table.integer('customer_id').unique();
            table.string('ip');
            console.log("Updated 'customers' table.");
        });
        await knex.schema.alterTable("participants", table => {
            table.uuid('account_id').defaultTo(knex.raw('uuid_generate_v4()'));
            console.log("Updated 'participants' table.");
        });

        return await knex;

    },
    down : async function(knex){
        await knex.schema.alterTable("customers", table => {
            table.dropColumns('customer_id');
            table.dropColumns('ip');
        });
        await knex.schema.alterTable("participants", table => {
            table.dropColumns('account_id');
        });

        return await knex;
    }
}