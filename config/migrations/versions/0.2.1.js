module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("files", table => {
            table.string('file_name');
            console.log("Updated 'files' table.");
        });

        return await knex;

    },
    down : async function(knex){
        await knex.schema.alterTable("files", table => {
            table.dropColumns('file_name');
        });

        return await knex;
    }
}