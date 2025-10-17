'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Dashboard_Summary_Pos_Customers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      customerId: {
        type: Sequelize.INTEGER
      },
      totalPos: {
        type: Sequelize.INTEGER
      },
      totalAmountPos: {
        type: Sequelize.BIGINT
      },
      totalAmountPaidPos: {
        type: Sequelize.BIGINT
      },
      totalAmountDebtPos: {
        type: Sequelize.BIGINT
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
    await queryInterface.dropTable('Dashboard_Summary_Pos_Customers');
  }
};