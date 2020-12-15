module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("participants", table => {
            table.string('fname');
            table.boolean('lname');
            table.jsonb('metadata');
            console.log("Updated 'participants' table.");
        })

        return await knex;

    },
    down : async function(knex){
        await knex.schema.alterTable("participants", table => {
            table.dropColumns('fname');
            table.dropColumns('lname');
            table.dropColumns('metadata');
        })

        return await knex;
    }
}