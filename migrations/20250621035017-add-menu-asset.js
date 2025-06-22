"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Aset Lancar Bulanan",
        description: "Aset Lancar Bulanan",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 34,
      },
      {
        name: "Asset Tidak Lancar Bulanan",
        description: "Asset Tidak Lancar Bulanan",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 35,
      },
      {
        name: "Master Aset Tidak Lancar",
        description: "Master Aset Tidak Lancar",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 36,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Master_Menus",
      {
        name: {
          [Sequelize.Op.in]: ["Aset Lancar Bulanan", "Asset Tidak Lancar Bulanan", "Master Aset Tidak Lancar"],
        },
      },
      {}
    );
  },
};
