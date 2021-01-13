module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("clicks", table => {
            table.integer('participant_id').references('participants.id');
            console.log("Updated 'clicks' table.");
        });
        return await knex;
    },
    down : async function(knex){
        await knex.schema.alterTable("clicks", table => {
            table.dropColumns('participant_id');
        })

        return await knex;
    }
}