"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**Product_Logs*/
    await queryInterface.addConstraint("Product_Logs", {
      fields: ["productId"],
      type: "foreign key",
      name: "fk_Product_Logs_productId",
      references: {
        table: "Master_Products", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.sequelize.query(
      `ALTER INDEX product__logs_product_id RENAME TO idx_Product_Logs_productId;`
    );
    await queryInterface.addConstraint("Product_Logs", {
      fields: ["userId"],
      type: "foreign key",
      name: "fk_Product_Logs_userId",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });

    /**Stock_Opname_Products*/
    await queryInterface.addConstraint("Stock_Opname_Products", {
      fields: ["stockOpnameId"],
      type: "foreign key",
      name: "fk_Stock_Opname_Products_stockOpnameId",
      references: {
        table: "Stock_Opnames", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex("Stock_Opname_Products", ["stockOpnameId"], {
      name: "idx_Stock_Opname_Products_stockOpnameId", // Name of the index
      unique: false, // Index is not unique
    });
    await queryInterface.addConstraint("Stock_Opname_Products", {
      fields: ["warehouseProductId"],
      type: "foreign key",
      name: "fk_Stock_Opname_Products_warehouseProductId",
      references: {
        table: "Warehouse_Products", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });

    /**Stock_Opnames*/
    await queryInterface.addConstraint("Stock_Opnames", {
      fields: ["warehouseId"],
      type: "foreign key",
      name: "fk_Stock_Opnames_warehouseId",
      references: {
        table: "Master_Warehouses", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex("Stock_Opnames", ["warehouseId"], {
      name: "idx_Stock_Opnames_warehouseId", // Name of the index
      unique: false, // Index is not unique
    });
    await queryInterface.addConstraint("Stock_Opnames", {
      fields: ["createdBy"],
      type: "foreign key",
      name: "fk_Stock_Opnames_createdBy",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Update behavior
      onDelete: "RESTRICT",
    });
    await queryInterface.addConstraint("Stock_Opnames", {
      fields: ["deletedBy"],
      type: "foreign key",
      name: "fk_Stock_Opnames_deletedBy",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Update behavior
      onDelete: "RESTRICT",
    });
    await queryInterface.addConstraint("Stock_Opnames", {
      fields: ["updatedBy"],
      type: "foreign key",
      name: "fk_Stock_Opnames_updatedBy",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Update behavior
      onDelete: "RESTRICT",
    });

    /**Warehouse_Products*/
    await queryInterface.addConstraint("Warehouse_Products", {
      fields: ["productId"],
      type: "foreign key",
      name: "fk_Warehouse_Products_productId",
      references: {
        table: "Master_Products", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex("Warehouse_Products", ["productId"], {
      name: "idx_Warehouse_Products_productId", // Name of the index
      unique: false, // Index is not unique
    });
    await queryInterface.addConstraint("Warehouse_Products", {
      fields: ["warehouseId"],
      type: "foreign key",
      name: "fk_Warehouse_Products_warehouseId",
      references: {
        table: "Master_Warehouses", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex("Warehouse_Products", ["warehouseId"], {
      name: "idx_Warehouse_Products_warehouseId", // Name of the index
      unique: false, // Index is not unique
    });
    await queryInterface.addConstraint("Warehouse_Products", {
      fields: ["unitId"],
      type: "foreign key",
      name: "fk_Warehouse_Products_unitId",
      references: {
        table: "Master_Units", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex("Warehouse_Products", ["unitId"], {
      name: "idx_Warehouse_Products_unitId", // Name of the index
      unique: false, // Index is not unique
    });
    await queryInterface.addConstraint("Warehouse_Products", {
      fields: ["warehouseRackId"],
      type: "foreign key",
      name: "fk_Warehouse_Products_warehouseRackId",
      references: {
        table: "Master_Warehouse_Racks", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
  },
  async down(queryInterface, Sequelize) {
    /**Product_Logs*/
    await queryInterface.removeConstraint(
      "Product_Logs",
      "fk_Product_Logs_productId"
    );
    // rename index
    await queryInterface.sequelize.query(
      `ALTER INDEX idx_Product_Logs_productId RENAME TO product__logs_product_id;`
    );
    await queryInterface.removeConstraint(
      "Product_Logs",
      "fk_Product_Logs_userId"
    );

    /**Stock_Opname_Products*/
    await queryInterface.removeConstraint(
      "Stock_Opname_Products",
      "fk_Stock_Opname_Products_stockOpnameId"
    );
    await queryInterface.removeIndex(
      "Stock_Opname_Products",
      "idx_Stock_Opname_Products_stockOpnameId"
    );
    await queryInterface.removeConstraint(
      "Stock_Opname_Products",
      "fk_Stock_Opname_Products_warehouseProductId"
    );

    /**Stock_Opnames*/
    await queryInterface.removeConstraint(
      "Stock_Opnames",
      "fk_Stock_Opnames_warehouseId"
    );
    await queryInterface.removeIndex(
      "Stock_Opnames",
      "idx_Stock_Opnames_warehouseId"
    );
    await queryInterface.removeConstraint(
      "Stock_Opnames",
      "fk_Stock_Opnames_createdBy"
    );
    await queryInterface.removeConstraint(
      "Stock_Opnames",
      "fk_Stock_Opnames_deletedBy"
    );
    await queryInterface.removeConstraint(
      "Stock_Opnames",
      "fk_Stock_Opnames_updatedBy"
    );

    /**Warehouse_Products*/
    await queryInterface.removeConstraint(
      "Warehouse_Products",
      "fk_Warehouse_Products_productId"
    );
    await queryInterface.removeIndex(
      "Warehouse_Products",
      "idx_Warehouse_Products_productId"
    );
    await queryInterface.removeConstraint(
      "Warehouse_Products",
      "fk_Warehouse_Products_warehouseId"
    );
    await queryInterface.removeIndex(
      "Warehouse_Products",
      "idx_Warehouse_Products_warehouseId"
    );
    await queryInterface.removeConstraint(
      "Warehouse_Products",
      "fk_Warehouse_Products_unitId"
    );
    await queryInterface.removeIndex(
      "Warehouse_Products",
      "idx_Warehouse_Products_unitId"
    );
    await queryInterface.removeConstraint(
      "Warehouse_Products",
      "fk_Warehouse_Products_warehouseRackId"
    );
  },
};
