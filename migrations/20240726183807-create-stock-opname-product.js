'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Stock_Opname_Products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      stockOpnameId: {
        type: Sequelize.INTEGER
      },
      warehouseProductId: {
        type: Sequelize.INTEGER
      },
      systemStock: {
        type: Sequelize.INTEGER
      },
      actualStock: {
        type: Sequelize.INTEGER
      },
      diff: {
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('Stock_Opname_Products');
  }
};