module.exports = {
    up : async function(knex){
        await knex.schema.alterTable("urls", table => {
            table.integer('fb_shares');
            table.integer('twitter_shares');
            table.integer('email_shares');
            table.integer('linkedin_shares');
            table.integer('whatsapp_shares');
            console.log("Updated 'urls' table.");
        });
        return await knex;
    },
    down : async function(knex){
        await knex.schema.alterTable("urls", table => {
            table.dropColumns('fb_shares');
            table.dropColumns('twitter_shares');
            table.dropColumns('linkedin_shares');
            table.dropColumns('email_shares');
            table.dropColumns('whatsapp_shares');
        })

        return await knex;
    }
}