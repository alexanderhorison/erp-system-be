"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "Stock_Adjustment_Histories",
      "deliveryOrderReceiptId",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
      }
    );
    await queryInterface.addConstraint("Stock_Adjustment_Histories", {
      fields: ["deliveryOrderReceiptId"],
      type: "foreign key",
      name: "fk_Stock_Adjustment_Histories_deliveryOrderReceiptId", // Custom name for the constraint
      references: {
        table: "Delivery_Order_Receipts", // Name of the referenced table
        field: "id", // Primary key in the referenced table
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT", // Action when the referenced row is deleted
    });
    await queryInterface.addColumn(
      "Stock_Adjustment_Histories",
      "deliveryOrderReceiptOutstandingId",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
      }
    );
    await queryInterface.addConstraint("Stock_Adjustment_Histories", {
      fields: ["deliveryOrderReceiptOutstandingId"],
      type: "foreign key",
      name: "fk_Stock_Adjustment_Histories_deliveryOrderReceiptOutstandingId", // Custom name for the constraint
      references: {
        table: "Delivery_Order_Receipt_Outstandings", // Name of the referenced table
        field: "id", // Primary key in the referenced table
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT", // Action when the referenced row is deleted
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "Stock_Adjustment_Histories",
      "fk_Stock_Adjustment_Histories_deliveryOrderReceiptOutstandingId"
    );
    await queryInterface.removeColumn(
      "Stock_Adjustment_Histories",
      "deliveryOrderReceiptOutstandingId"
    );
    await queryInterface.removeConstraint(
      "Stock_Adjustment_Histories",
      "fk_Stock_Adjustment_Histories_deliveryOrderReceiptId"
    );
    await queryInterface.removeColumn(
      "Stock_Adjustment_Histories",
      "deliveryOrderReceiptId"
    );
  },
};
