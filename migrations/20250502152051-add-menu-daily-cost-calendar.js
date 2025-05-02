'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Daily Cost Calendar",
        description: "Daily Cost Calendar",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 33,
      },
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Master_Menus", {
      menuId: 33,
    });
  }
};
