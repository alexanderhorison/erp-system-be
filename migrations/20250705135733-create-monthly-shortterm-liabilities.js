'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Monthly_Shortterm_Liabilities', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATEONLY
      },
      tradePayables: {
        type: Sequelize.BIGINT
      },
      nonTradePayables: {
        type: Sequelize.BIGINT
      },
      accruedExpenses: {
        type: Sequelize.BIGINT
      },
      taxPayables: {
        type: Sequelize.BIGINT
      },
      totalShortTermLiabilities: {
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

    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Liabilitas Jangka Pendek Bulanan",
        description: "Liabilitas Jangka Pendek Bulanan",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 37,
      },
      {
        name: "Liabilitas Jangka Panjang Bulanan",
        description: "Liabilitas Jangka Panjang Bulanan",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 38,
      },
      {
        name: "Ekuitas Bulanan",
        description: "Ekuitas Bulanan",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 39,
      },
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Master_Menus",
      {
        name: {
          [Sequelize.Op.in]: ["Liabilitas Jangka Pendek Bulanan", "Liabilitas Jangka Panjang Bulanan", "Ekuitas Bulanan"],
        },
      },
      {}
    );
    await queryInterface.dropTable('Monthly_Shortterm_Liabilities');
  }
};