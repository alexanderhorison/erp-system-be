'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Monthly_Longterm_Liabilities', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATEONLY
      },
      shareHolderLoans: {
        type: Sequelize.BIGINT
      },
      longTermBankLoans: {
        type: Sequelize.BIGINT
      },
      otherLongtermLiabilities: {
        type: Sequelize.BIGINT
      },
      totalLongtermLiabilities: {
        type: Sequelize.BIGINT
      },
      notes: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Monthly_Longterm_Liabilities');
  }
};