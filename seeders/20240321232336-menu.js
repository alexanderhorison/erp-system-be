"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const menus = [
      {
        name: "Dashboard",
        description: "homepage atau dashboard",
      },
      {
        name: "Master Data",
        description: "menu master data",
      },
      {
        name: "Surat Jalan",
        description: "menu surat jalan",
      },
      {
        name: "User",
        description: "menu user & role permission",
      },
      {
        name: "Stock Management",
        description: "menu stock management",
      },
    ];
    menus.forEach((menu) => {
      menu.createdAt = new Date();
      menu.updatedAt = new Date();
    });
    await queryInterface.bulkInsert("Menus", menus, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Menus",
      {
        name: [
          "Dashboard",
          "Master Data",
          "Surat Jalan",
          "User",
          "Stock Management",
        ],
      },
      {}
    );
  },
};
