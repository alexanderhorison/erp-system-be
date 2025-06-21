"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Asset Lancar",
        description: "Asset Lancar",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 34,
      },
      {
        name: "Asset Tidak Lancar",
        description: "Asset Tidak Lancar",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 35,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Master_Menus",
      {
        name: {
          [Sequelize.Op.in]: ["Asset Lancar", "Asset Tidak Lancar"],
        },
      },
      {}
    );
  },
};
