"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Pos_Transaction_Payment_Histories", {
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
      total: {
        type: Sequelize.BIGINT,
      },
      posPaymentTypeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Pos_Payment_Types", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
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
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Master_Users", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
    });
    await queryInterface.addIndex("Pos_Transaction_Payment_Histories", [
      "posPaymentTypeId",
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Pos_Transaction_Payment_Histories");
  },
};
