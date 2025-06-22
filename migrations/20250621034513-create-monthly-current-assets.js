"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Monthly_Current_Assets", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      period: {
        type: Sequelize.STRING(7), // Format: YYYY-MM
        allowNull: false,
      },
      cashAndBank: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      accountsReceivable: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      thirdPartyReceivable: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      otherReceivables: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      inventory: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      advancePayments: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      tax: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      grandTotal: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Monthly_Current_Assets");
  },
};
