"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Sales_Order_Payments", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      typePayment: {
        type: Sequelize.STRING,
      },
      amount: {
        type: Sequelize.BIGINT,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      salesOrderId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Sales_Orders", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Master_Users", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
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
    await queryInterface.addIndex("Sales_Order_Payments", ["salesOrderId"]);
    await queryInterface.addColumn("Sales_Orders", "amountPaid", {
      type: Sequelize.BIGINT,
      allowNull: true, // Allow NULLs
    });
    await queryInterface.addColumn("Sales_Orders", "amountDebt", {
      type: Sequelize.BIGINT,
      allowNull: true, // Allow NULLs
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Sales_Orders", "amountDebt");
    await queryInterface.removeColumn("Sales_Orders", "amountPaid");
    await queryInterface.dropTable("Sales_Order_Payments");
  },
};
