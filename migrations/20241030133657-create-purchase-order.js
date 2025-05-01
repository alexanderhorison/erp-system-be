"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Purchase_Orders", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      code: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      warehouseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Master_Warehouses", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      vendorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Master_Vendors", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      grandTotal: {
        type: Sequelize.BIGINT,
      },
      amountPaid: {
        type: Sequelize.BIGINT,
        allowNull: true, // Allow NULLs
        defaultValue: 0, // Amount
      },
      amountDebt: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0,
      },
      grandTotalBarter: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0,
      },
      grandTotalVendor: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "PENDING",
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
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
      approvedBy: {
        type: Sequelize.INTEGER,
        references: {
          model: "Master_Users", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      approvedAt: {
        type: Sequelize.DATE,
      },
      dueDate: {
        type: Sequelize.STRING,
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
    await queryInterface.addIndex("Purchase_Orders", ["warehouseId"]);
    // add Menu Sales Order
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Purchase Order",
        description: "Purchase Order",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 25,
      },
    ]);
    // alter stock adjustments history add purchaseOrderId
    await queryInterface.addColumn(
      "Stock_Adjustment_Histories",
      "purchaseOrderId",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Purchase_Orders",
          key: "id",
        },
      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "Stock_Adjustment_Histories",
      "purchaseOrderId"
    );
    await queryInterface.bulkDelete("Master_Menus", {
      name: "Purchase Order",
      menuId: 25,
    });
    await queryInterface.dropTable("Purchase_Orders");
  },
};
