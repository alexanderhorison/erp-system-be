'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Master_Transformations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      MasterProductId: {
        type: Sequelize.INTEGER
      },
      UnitFromId: {
        type: Sequelize.INTEGER
      },
      amount_from: {
        type: Sequelize.INTEGER
      },
      UnitToId: {
        type: Sequelize.INTEGER
      },
      amount_to: {
        type: Sequelize.INTEGER
      },
      info: {
        type: Sequelize.TEXT
      },
      createdBy: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Master_Transformations');
  }
};