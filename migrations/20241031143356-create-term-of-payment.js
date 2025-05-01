"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Term_Of_Payments", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      purchaseOrderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Purchase_Orders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reminderDate: {
        type: Sequelize.INTEGER,
        defaultValue: 2,
      },
      isSendEmail: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.addIndex("Term_Of_Payments", ["purchaseOrderId"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Term_Of_Payments");
  },
};
