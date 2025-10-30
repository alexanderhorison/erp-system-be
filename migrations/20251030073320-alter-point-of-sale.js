'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("Pos_Transactions", "lastDebt", {
      type: Sequelize.BIGINT,
      defaultValue: 0,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("Pos_Transactions", "lastDebt");
  }
};
