"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Dashboard",
        description: "Dashboard",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 20,
      },
      {
        name: "Customer",
        description: "Manajemen Customer",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 21,
      },
      {
        name: "Rank",
        description: "Manajemen Rank",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 22,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Master_Menus",
      {
        name: ["Rank", "Customer", "Dashboard"],
      },
      {}
    );
  },
};
