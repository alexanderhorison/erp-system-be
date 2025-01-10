"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn("Pos_Payment_Types", "description", {
      type: Sequelize.TEXT,
    });
    await queryInterface.addColumn("Pos_Payment_Types", "icon", {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "Pos_Payment_Types",
      "icon"
    );
    await queryInterface.removeColumn(
      "Pos_Payment_Types",
      "description"
    );
  },
};
