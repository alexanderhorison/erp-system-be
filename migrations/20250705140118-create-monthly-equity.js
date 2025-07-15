'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Monthly_Equities', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATEONLY
      },
      shareCapital: {
        type: Sequelize.BIGINT
      },
      retainedEarningsPreviousYear: {
        type: Sequelize.BIGINT
      },
      retainedEarningsCurrentYear: {
        type: Sequelize.BIGINT
      },
      retainedEarningsThisMonth: {
        type: Sequelize.BIGINT
      },
      totalEquity: {
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
    await queryInterface.dropTable('Monthly_Equities');
  }
};