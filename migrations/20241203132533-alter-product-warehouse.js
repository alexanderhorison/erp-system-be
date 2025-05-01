"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Warehouse_Products", "isFavorite", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Warehouse_Products", "isFavorite");
  },
};
