module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("invitations", table => {
            table.integer('participant_id').references('participants.id');
            console.log("Updated 'invitations' table.");
        });
        return await knex;
    },
    down : async function(knex){
        await knex.schema.alterTable("invitations", table => {
            table.dropColumns('participant_id');
        })

        return await knex;
    }
}