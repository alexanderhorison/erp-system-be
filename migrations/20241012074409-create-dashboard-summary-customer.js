'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Dashboard_Summary_Customers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      customerId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Master_Customers',
          key: 'id'
        },
        onUpdate: "CASCADE",
        onDelete: 'RESTRICT'
      },
      totalSalesOrder: {
        type: Sequelize.INTEGER
      },
      totalAmountSalesOrder: {
        type: Sequelize.BIGINT
      },
      totalAmountPaidSalesOrder: {
        type: Sequelize.BIGINT
      },
      totalAmountDebtSalesOrder: {
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
    await queryInterface.addIndex("Dashboard_Summary_Customers", ["customerId"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Dashboard_Summary_Customers');
  }
};