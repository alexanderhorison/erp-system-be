'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Delivery_Order_Receipt_Outstanding_Products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      deliveryOrderReceiptOutstandingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Delivery_Order_Receipt_Outstandings", // Name of the target table
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
      outstandingQuantity: {
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
    await queryInterface.addIndex("Delivery_Order_Receipt_Outstanding_Products", ["deliveryOrderReceiptOutstandingId"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Delivery_Order_Receipt_Outstanding_Products');
  }
};