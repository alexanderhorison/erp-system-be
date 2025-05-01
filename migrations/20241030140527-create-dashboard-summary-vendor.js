"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Dashboard_Summary_Vendors", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      vendorId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Master_Vendors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      totalPurchaseOrder: {
        type: Sequelize.INTEGER,
      },
      totalAmountPurchaseOrder: {
        type: Sequelize.BIGINT,
      },
      totalAmountPaidPurchaseOrder: {
        type: Sequelize.BIGINT,
      },
      totalAmountDebtPurchaseOrder: {
        type: Sequelize.BIGINT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex("Dashboard_Summary_Vendors", [
      "vendorId",
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Dashboard_Summary_Vendors");
  },
};
