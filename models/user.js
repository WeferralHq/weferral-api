let Role = require('./role');
let references = [
    {"model": Role, "referenceField": "role_id", "direction": "to", "readOnly": true}
];
let User = require('./base/entity')("users", references);


/**

 */
let createUser = function (options, callback) {
    let self = this;
    self.data.email = self.data.email.toLowerCase();
    
    Role.findOne("role_name", "staff", function (role) {
        if (!self.data.role_id) {
            self.data.role_id = role.get("id");
        }
        //Use the Entity create to create the user
        self.create(function (err, created_user) {
            console.log(`Create User: ${created_user}`);
            callback(err, created_user);
        });
    });
};

//allows to pass option override, no longer relying 100% on store.
User.prototype.createUser = new Proxy(createUser, {
    apply: function (target, thisArg, argList) {
        if (argList.length === 2) {
            target.bind(thisArg)(...argList)
        } else {
            target.bind(thisArg)(undefined, ...argList);
        }
    }
});

User.prototype.updateUser = async function () {
    let self = this;
    let store = require("../config/redux/store");
    self.data.email = self.data.email.toLowerCase();
    let updatedUser = await self.update();
    store.dispatchEvent("user_updated", updatedUser);
    return updatedUser;
};

User.prototype.deleteUser = function (callback) {
    let self = this;
    new Promise(function (resolve, reject) {
        self.delete(function (err, deleted_user) {
            if (err) {
                return reject('User cannot be deleted, must be suspended. User has connected records!');
            }
            return resolve(`User ${self.data.id} has been deleted from database!`);
        });
    }).then(function () {
        callback(null, `User ID: ${self.data.id} has been removed.`);
    })
        .catch(function (err) {
            callback(err, null);
        });
};

/**
 * This function will cancel all users services in Stripe and internal database. Then will mark the user as suspended.
 * @param callback - Final suspension result, or error.
 */
//THERES NO CALLBACK
//THIS WAS CHANGED BUT CALLBACK NOT REMOVED
User.prototype.suspend = async function () {
    let self = this;
    console.log('User status: ', self.data.status);
    if (self.data.status !== 'invited' && self.data.status !== 'suspended') {
        self.data.status = "suspended";
        return await self.update();

    }
    else {
        throw 'User can not be invited or already suspended'
    }
};

/**
 * This function marks a users status from suspended to active.
 * @param callback - updated user, or error.
 */
User.prototype.unsuspend = function (callback) {
    let self = this;
    if (self.data.status === 'suspended') {
        self.data.status = 'active';
        self.update(function (err, user) {
            if (!err) {
                callback(null, user);
            } else {
                callback(err, null);
            }
        });
    }
    else {
        if (!self.data.customer_id) {
            callback('User is deleted', null);
        } else {
            callback('User is not suspended', null);
        }
    }
};

//TODO: Implement User.prototype.update override once the above create is simplified. Implement when doing user setting page.

/**
 * Override of the "findOnRelative" function to filter out passwords for users.
 */
//TODO maybe have to override all FInds for user if we never want password. (Maybe use a solution similar to next() for filtering)
User.findOnRelative = function (key, value, callback) {
    User.findAll(key, value, function (result) {
        let noPassword = result.map(function (entity) {
            delete entity.data.password;
            return entity
        });
        callback(noPassword);
    })
};



module.exports = User;