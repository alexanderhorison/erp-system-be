"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Purchase_Order_Barter_Details", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      purchaseOrderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Purchase_Orders", // Name of the target table
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
    await queryInterface.addIndex("Purchase_Order_Barter_Details", [
      "purchaseOrderId",
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Purchase_Order_Barter_Details");
  },
};
