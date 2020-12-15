let User = require('./user');
let references = [
    {"model": User, "referenceField": "role_id", "direction": "to", "readOnly": true}
];
let Url = require('./base/entity')("urls", references);
let nanoid = require('nanoid');

let generateShortUrl = async function() {
    let shortUrl = nanoid(7)
    let urlAlreadyExists = await Url.findOne('shortned_url',shortUrl)
    if (urlAlreadyExists) {
      generateShortUrl();
    }
    return shortUrl;
}


Url.prototype.shortUrl = async function () {
    let self = this;
    let result = {}
    //self.data.shortned_url = await generateShortUrl();

    self.create(function (created_url) {
        console.log(`Create Url: ${created_url}`);
        return created_url;
    });

    
    return result;
}

module.exports = Url;