module.exports = {

    up: async function (knex) {
        let Permission = require('../../../models/permission');
        let swaggerJSON = require("../../../api-docs/api-paths.json");
        let additionalPermissions = ["can_administrate", "can_manage"];
        let initialRoleMap = {
            "admin": [],
            "staff": [],
            "developer": []
        };
        let permissions = [];
        for (let route in swaggerJSON) {
            for (let method in swaggerJSON[route]) {
                permissions.push(swaggerJSON[route][method].operationId);
            }
        }

        //add additional permissions
        additionalPermissions.forEach(function (element) {
            permissions.push(element);
        });

        let permission_data = permissions.map(permission => ({"permission_name": permission}));

        /*let new_permission = Permission.batchCreate(permission_data, function (result) {
            return result;
        })*/

        return Permission.batchCreate(permission_data);
    },

    down: async function (knex) {
    }
}