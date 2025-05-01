'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Stock_Opnames', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING
      },
      warehouseId: {
        type: Sequelize.INTEGER
      },
      opnameDate: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.STRING
      },
      notes: {
        type: Sequelize.TEXT
      },
      createdBy: {
        type: Sequelize.INTEGER
      },
      updatedBy: {
        type: Sequelize.INTEGER
      },
      deletedBy: {
        type: Sequelize.INTEGER
      },
      deletedAt: {
        type: Sequelize.DATE
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

    const lastMenu = await queryInterface.sequelize.query(
      `SELECT id, "menuId" FROM "Master_Menus" ORDER BY id DESC LIMIT 1;`,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    await queryInterface.bulkInsert("Master_Menus",
      [
        {
          name: "Stock Opname",
          description: "Stock Opname Produk",
          createdAt: new Date(),
          updatedAt: new Date(),
          menuId: lastMenu[0].menuId + 1
        }
      ]
    )
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Stock_Opnames');
  }
};