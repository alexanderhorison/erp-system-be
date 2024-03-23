"use strict";

const { encrypt } = require('../helpers/bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const role = await queryInterface.sequelize.query(
      `SELECT id FROM "Roles" WHERE "name" = 'Admin';`,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    await queryInterface.bulkInsert(
      "Users",
      [
        {
          name: "Superadmin",
          description: "administrator",
          email: "superadmin@mail.com",
          user_name: "superadmin",
          password: encrypt(process.env.DEFAULT_PASSWORD || "qwerty"),
          RoleId: role[0].id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", { user_name: "superadmin" }, {});
  },
};
