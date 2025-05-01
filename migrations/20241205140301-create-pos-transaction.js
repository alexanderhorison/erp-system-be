"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Pos_Transactions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      customerId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Master_Customers", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      code: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      subTotal: {
        type: Sequelize.BIGINT,
      },
      totalDiscount: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
      },
      grandTotal: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      totalPayment: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.STRING,
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
      deletedAt: {
        type: Sequelize.DATE,
      },
      deletedBy: {
        type: Sequelize.INTEGER,
        references: {
          model: "Master_Users", // Name of the target table
          key: "id", // Key in the target table that this column references
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
    });
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Point Of Sale",
        description: "Point Of Sale",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 27,
      },
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Master_Menus", {
      name: "Point Of Sale",
      menuId: 27,
    });
    await queryInterface.dropTable("Pos_Transactions");
  },
};
