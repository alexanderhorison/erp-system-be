"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint("Delivery_Order_Products", {
      fields: ["productWarehouseId"],
      type: "foreign key",
      name: "fk_Delivery_Order_Products_productWarehouseId",
      references: {
        table: "Warehouse_Products", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex(
      "Delivery_Order_Products",
      ["productWarehouseId"],
      {
        name: "idx_Delivery_Order_Products_productWarehouseId", // Name of the index
        unique: false, // Index is not unique
      }
    );

    await queryInterface.addConstraint("Delivery_Orders", {
      fields: ["warehouseOriginId"],
      type: "foreign key",
      name: "fk_Delivery_Orders_warehouseOriginId",
      references: {
        table: "Master_Warehouses", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addConstraint("Delivery_Orders", {
      fields: ["warehouseDestinationId"],
      type: "foreign key",
      name: "fk_Delivery_Orders_warehouseDestinationId",
      references: {
        table: "Master_Warehouses", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addConstraint("Delivery_Orders", {
      fields: ["createdBy"],
      type: "foreign key",
      name: "fk_Delivery_Orders_createdBy",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Update behavior
      onDelete: "RESTRICT",
    });
    await queryInterface.addConstraint("Delivery_Orders", {
      fields: ["receivedBy"],
      type: "foreign key",
      name: "fk_Delivery_Orders_receivedBy",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Update behavior
      onDelete: "RESTRICT",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "Delivery_Order_Products",
      "fk_Delivery_Order_Products_productWarehouseId"
    );
    await queryInterface.removeIndex(
      "Delivery_Order_Products",
      "idx_Delivery_Order_Products_productWarehouseId"
    );
    await queryInterface.removeConstraint(
      "Delivery_Orders",
      "fk_Delivery_Orders_warehouseDestinationId"
    );
    await queryInterface.removeConstraint(
      "Delivery_Orders",
      "fk_Delivery_Orders_warehouseOriginId"
    );
    await queryInterface.removeConstraint(
      "Delivery_Orders",
      "fk_Delivery_Orders_receivedBy"
    );
    await queryInterface.removeConstraint(
      "Delivery_Orders",
      "fk_Delivery_Orders_createdBy"
    );
  },
};
