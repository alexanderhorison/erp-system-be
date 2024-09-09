"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "Delivery_Order_Receipt_Outstanding_Products",
      "productWarehouseId",
      {
        type: Sequelize.INTEGER,
        allowNull: true, // Allow NULLs
      }
    );
    await queryInterface.addConstraint(
      "Delivery_Order_Receipt_Outstanding_Products",
      {
        fields: ["productWarehouseId"],
        type: "foreign key",
        name: "fk_Delivery_Order_Receipt_Outstanding_Products_productWarehouseId", // Custom name for the constraint
        references: {
          table: "Warehouse_Products", // Name of the referenced table
          field: "id", // Primary key in the referenced table
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT", // Action when the referenced row is deleted
      }
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeConstraint(
      "Delivery_Order_Receipt_Outstanding_Products",
      "fk_Delivery_Order_Receipt_Outstanding_Products_productWarehouseId"
    );
    await queryInterface.removeColumn(
      "Delivery_Order_Receipt_Outstanding_Products",
      "productWarehouseId"
    );
  },
};
