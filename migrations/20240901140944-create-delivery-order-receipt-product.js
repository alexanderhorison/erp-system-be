'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Delivery_Order_Receipt_Products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      deliveryOrderReceiptId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Delivery_Order_Receipts", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      deliveryOrderProductId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Delivery_Order_Products", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      receiveQuantity: {
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
    await queryInterface.addIndex("Delivery_Order_Receipt_Products", ["deliveryOrderReceiptId"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Delivery_Order_Receipt_Products');
  }
};