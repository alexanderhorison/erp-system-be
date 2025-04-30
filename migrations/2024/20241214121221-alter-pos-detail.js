"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Pos_Transaction_Details", "notes", {
      type: Sequelize.TEXT,
    });
    await queryInterface.addColumn(
      "Stock_Adjustment_Histories",
      "posTransactionId",
      {
        type: Sequelize.INTEGER,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "Stock_Adjustment_Histories",
      "posTransactionId"
    );
    await queryInterface.removeColumn("Pos_Transaction_Details", "notes");
  },
};
