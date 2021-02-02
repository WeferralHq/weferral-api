module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("notifications", table => {
            table.integer('participant_id').references('participants.id').onDelete('cascade');
            console.log("Updated 'notifications' table.");
        });

        return await knex;

    },
    down : async function(knex){
        await knex.schema.alterTable("notifications", table => {
            table.dropColumns('participant_id');
        });

        return await knex;
    }
}