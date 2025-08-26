'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Pr_Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      notes: {
        type: Sequelize.TEXT
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
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    // Add menu product request order
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Product Request Order",
        description: "Request Product",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 44,
      },
    ]);

    // alter Delivery Orders
    await queryInterface.addColumn(
      "Delivery_Orders",
      "productRequestOrderId",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Pr_Orders",
          key: "id",
        },
      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "Delivery_Orders",
      "productRequestOrderId"
    );

    await queryInterface.bulkDelete("Master_Menus", {
      name: "Product Request Order",
      menuId: 44,
    });
    await queryInterface.dropTable('Pr_Orders');
  }
};