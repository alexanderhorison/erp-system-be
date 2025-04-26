"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Master_Modals", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Master_Products", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      unitId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Master_Units", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amountPurchaseOrder: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      modal: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      totalPurchaseOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.addIndex("Master_Modals", ["productId", "unitId"]);
    await queryInterface.addColumn("Sales_Order_Details", "modal", { type: Sequelize.BIGINT });
    await queryInterface.addColumn("Purchase_Order_Barter_Details", "modal", { type: Sequelize.BIGINT });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Purchase_Order_Barter_Details", "modal");
    await queryInterface.removeColumn("Sales_Order_Details", "modal");
    await queryInterface.dropTable("Master_Modals");
  },
};
