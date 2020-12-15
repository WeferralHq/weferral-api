module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("referrals", table => {
            table.string('fname');
            table.boolean('lname');
            table.jsonb('metadata');
            console.log("Updated 'referrals' table.");
        })

        return await knex;

    },
    down : async function(knex){
        await knex.schema.alterTable("referrals", table => {
            table.dropColumns('fname');
            table.dropColumns('lname');
            table.dropColumns('metadata');
        })

        return await knex;
    }
}