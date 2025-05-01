"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Delivery_Order_Receipts", "notes", {
      type: Sequelize.TEXT,
      allowNull: true, // Allow NULLs
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Delivery_Order_Receipts", "notes");
  },
};
