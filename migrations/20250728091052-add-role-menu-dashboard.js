'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Dashboard Inventory",
        description: "Dashboard Inventory",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 40,
      },
      {
        name: "Dashboard Sales Order",
        description: "Dashboard Sales Order",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 41,
      },
      {
        name: "Dashboard Purchase Order",
        description: "Dashboard Purchase Order",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 42,
      },
      {
        name: "Dashboard Finance",
        description: "Dashboard Finance",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 43,
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Master_Menus", {
      menuId: [40, 41, 42, 43]
    });
  }
};
