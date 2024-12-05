"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Pos_Transaction_Details", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      posTransactionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Pos_Transactions", // Name of the target table
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
      title: {
        type: Sequelize.STRING,
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
    await queryInterface.addIndex("Pos_Transaction_Details", ["posTransactionId"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Pos_Transaction_Details");
  },
};
