'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Report",
        description: "Untuk semua report",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 30,
      },
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Master_Menus", {
      menuId: 30,
    });
  }
};
