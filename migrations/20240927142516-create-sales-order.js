"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Sales_Orders", {
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
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Master_Customers", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      grandTotal: {
        type: Sequelize.INTEGER,
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex("Sales_Orders", ["warehouseId"]);
    // add Menu Sales Order
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Sales Order",
        description: "Sales Order",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 23,
      },
    ]);
    // alter stock adjustments history add salesOrderId
    await queryInterface.addColumn(
      "Stock_Adjustment_Histories",
      "salesOrderId",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Sales_Orders",
          key: "id",
        },
      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "Stock_Adjustment_Histories",
      "salesOrderId"
    );
    await queryInterface.bulkDelete("Master_Menus", {
      name: "Sales Order",
      menuId: 23,
    });
    await queryInterface.dropTable("Sales_Orders");
  },
};
