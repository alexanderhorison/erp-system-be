'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Monthly_Non_Current_Assets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATEONLY
      },
      vehicleValue: {
        type: Sequelize.BIGINT
      },
      buildingValue: {
        type: Sequelize.BIGINT
      },
      buildingValue: {
        type: Sequelize.BIGINT
      },
      landValue: {
        type: Sequelize.BIGINT
      },
      longTermInvestment: {
        type: Sequelize.BIGINT
      },
      othersValue: {
        type: Sequelize.BIGINT
      },
      previousYearDepreciation: {
        type: Sequelize.BIGINT
      },
      currentYearDepreciation: {
        type: Sequelize.BIGINT
      },
      totalValue: {
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
    await queryInterface.dropTable('Monthly_Non_Current_Assets');
  }
};