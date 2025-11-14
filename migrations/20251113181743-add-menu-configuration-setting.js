'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Configuration Setting",
        description: "Configuration Setting",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 45,
      },
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Master_Menus", {
      menuId: 45,
    });
  }
};