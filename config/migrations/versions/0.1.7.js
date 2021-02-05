module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("password_reset_request", table => {
            table.integer('participant_id').references('participants.id').onDelete('cascade');
            console.log("Updated 'password_reset_request' table.");
        });

        return await knex;

    },
    down : async function(knex){
        await knex.schema.alterTable("password_reset_request", table => {
            table.dropColumns('participant_id');
        });

        return await knex;
    }
}