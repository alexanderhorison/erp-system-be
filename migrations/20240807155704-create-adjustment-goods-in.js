'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Adjustment_Goods_Ins', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING
      },
      warehouseDestinationId: {
        type: Sequelize.INTEGER
      },
      notes: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.STRING
      },
      createdBy: {
        type: Sequelize.INTEGER
      },
      approvedAt: {
        type: Sequelize.DATE
      },
      approvedBy: {
        type: Sequelize.INTEGER
      },
      deletedAt: {
        type: Sequelize.DATE
      },
      deletedBy: {
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
    await queryInterface.bulkInsert("Master_Menus",
      [
        {
          name: "Barang Masuk",
          description: "Barang Masuk",
          createdAt: new Date(),
          updatedAt: new Date(),
          menuId: 16,
        }
      ]
    )
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Adjustment_Goods_Ins');
  }
};