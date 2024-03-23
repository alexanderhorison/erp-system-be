"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch all menus
    const menus = await queryInterface.sequelize.query(
      `SELECT id FROM "Menus";`,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    let arrayMenu = menus.map((data) => data.id);
    await queryInterface.bulkInsert(
      "Roles",
      [
        {
          name: "Admin",
          description: "administrator",
          MenuId: arrayMenu,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Roles", { name: "Admin" }, {});
  },
};
