"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Internal_Transfer_Products", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      internalTransferId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Internal_Transfers", // Name of the target table
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
      warehouseRackFromId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Master_Warehouse_Racks", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      warehouseRackToId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Master_Warehouse_Racks", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
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
    await queryInterface.addIndex("Internal_Transfer_Products", [
      "internalTransferId",
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Internal_Transfer_Products");
  },
};
