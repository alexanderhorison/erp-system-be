"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Loan Stock",
        description: "Loan Stock",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 46,
      },
    ]);
    await queryInterface.addColumn("Stock_Loan_Histories", "lastQuantity", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Stock_Loan_Histories", "lastQuantity");
    await queryInterface.bulkDelete("Master_Menus", {
      menuId: 46,
    });
  },
};
