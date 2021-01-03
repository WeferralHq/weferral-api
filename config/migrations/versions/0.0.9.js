module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("customers", table => {
            table.integer('participant_id').references('participants.id');
            console.log("Updated 'customers' table.");
        });
        await knex.schema.alterTable("commissions", table => {
            table.integer('participant_id').references('participants.id');
            console.log("Updated 'commissions' table.");
        });
        return await knex;
    },
    down : async function(knex){
        await knex.schema.alterTable("customers", table => {
            table.dropColumns('participant_id');
        })
        await knex.schema.alterTable("commissions", table => {
            table.dropColumns('participant_id');
        })

        return await knex;
    }
}