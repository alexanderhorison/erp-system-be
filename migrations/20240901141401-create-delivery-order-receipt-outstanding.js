'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Delivery_Order_Receipt_Outstandings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
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
      status: {
        type: Sequelize.STRING,
        defaultValue: "PENDING",
        allowNull: false,
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
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.addIndex("Delivery_Order_Receipt_Outstandings", ["deliveryOrderReceiptId"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Delivery_Order_Receipt_Outstandings');
  }
};