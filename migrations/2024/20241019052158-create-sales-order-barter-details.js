"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Sales_Order_Barter_Details", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      salesOrderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Sales_Orders", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      warehouseProductId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Warehouse_Products", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      price: {
        type: Sequelize.BIGINT,
      },
      quantity: {
        type: Sequelize.INTEGER,
      },
      subTotal: {
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
    await queryInterface.addIndex("Sales_Order_Barter_Details", [
      "salesOrderId",
    ]);
    // alter Sales Order to have grandTotalBarter and grandTotalCustomer
    await queryInterface.addColumn("Sales_Orders", "grandTotalBarter", {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: 0,
    });
    await queryInterface.addColumn("Sales_Orders", "grandTotalCustomer", {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: 0,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Sales_Orders", "grandTotalCustomer");
    await queryInterface.removeColumn("Sales_Orders", "grandTotalBarter");
    await queryInterface.dropTable("Sales_Order_Barter_Details");
  },
};
