"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "Stock_Adjustment_Histories",
      "lastQuantity",
      {
        type: Sequelize.INTEGER,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "Stock_Adjustment_Histories",
      "lastQuantity"
    );
  },
};
