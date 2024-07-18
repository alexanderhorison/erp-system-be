"use strict";

const { encrypt } = require('../helpers/bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const role = await queryInterface.sequelize.query(
      `SELECT id FROM "Master_Roles" WHERE "name" = 'Admin';`,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    await queryInterface.bulkInsert(
      "Master_Users",
      [
        {
          name: "Superadmin",
          description: "administrator",
          email: "superadmin@mail.com",
          userName: "superadmin",
          password: encrypt(process.env.DEFAULT_PASSWORD || "qwerty"),
          roleId: role[0].id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Master_Users", { userName: "superadmin" }, {});
  },
};
