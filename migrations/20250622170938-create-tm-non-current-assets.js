'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tm_Non_Current_Assets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      assetValue: {
        type: Sequelize.BIGINT
      },
      assetType: {
        type: Sequelize.STRING
      },
      isDepreciable: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      acquisitionDate: {
        type: Sequelize.DATEONLY
      },
      depreciationMonths: {
        type: Sequelize.INTEGER
      },
      depreciationValue: {
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
    await queryInterface.dropTable('Tm_Non_Current_Assets');
  }
};