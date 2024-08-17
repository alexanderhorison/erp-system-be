"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    /**Master_Product_Transformations */
    await queryInterface.addConstraint("Master_Product_Transformations", {
      fields: ["masterProductId"],
      type: "foreign key",
      name: "fk_Master_Product_Transformations_masterProductId",
      references: {
        table: "Master_Products", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex(
      "Master_Product_Transformations",
      ["masterProductId"],
      {
        name: "idx_Master_Product_Transformations_masterProductId", // Name of the index
        unique: false, // Index is not unique
      }
    );
    await queryInterface.addConstraint("Master_Product_Transformations", {
      fields: ["unitFromId"],
      type: "foreign key",
      name: "fk_Master_Product_Transformations_unitFromId",
      references: {
        table: "Master_Units", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addConstraint("Master_Product_Transformations", {
      fields: ["unitToId"],
      type: "foreign key",
      name: "fk_Master_Product_Transformations_unitToId",
      references: {
        table: "Master_Units", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addConstraint("Master_Product_Transformations", {
      fields: ["createdBy"],
      type: "foreign key",
      name: "fk_Master_Product_Transformations_createdBy",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Update behavior
      onDelete: "RESTRICT",
    });

    /**Master_Products*/
    await queryInterface.addConstraint("Master_Products", {
      fields: ["categoryId"],
      type: "foreign key",
      name: "fk_Master_Products_categoryId",
      references: {
        table: "Master_Categories", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex("Master_Products", ["categoryId"], {
      name: "idx_Master_Products_categoryId", // Name of the index
      unique: false, // Index is not unique
    });
    await queryInterface.addConstraint("Master_Products", {
      fields: ["typeId"],
      type: "foreign key",
      name: "fk_Master_Products_typeId",
      references: {
        table: "Master_Types", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex("Master_Products", ["typeId"], {
      name: "idx_Master_Products_typeId", // Name of the index
      unique: false, // Index is not unique
    });
    await queryInterface.addConstraint("Master_Products", {
      fields: ["companyId"],
      type: "foreign key",
      name: "fk_Master_Products_companyId",
      references: {
        table: "Master_Companies", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex("Master_Products", ["companyId"], {
      name: "idx_Master_Products_companyId", // Name of the index
      unique: false, // Index is not unique
    });

    /**Master_Users*/
    await queryInterface.addConstraint("Master_Users", {
      fields: ["roleId"],
      type: "foreign key",
      name: "fk_Master_Users_roleId",
      references: {
        table: "Master_Roles", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex("Master_Users", ["roleId"], {
      name: "idx_Master_Users_roleId", // Name of the index
      unique: false, // Index is not unique
    });

    /**Master_Warehouse_Rack_Attributes*/
    await queryInterface.addConstraint("Master_Warehouse_Rack_Attributes", {
      fields: ["warehouseRackId"],
      type: "foreign key",
      name: "fk_Master_Warehouse_Rack_Attributes_warehouseRackId",
      references: {
        table: "Master_Warehouse_Racks", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex(
      "Master_Warehouse_Rack_Attributes",
      ["warehouseRackId"],
      {
        name: "idx_Master_Warehouse_Rack_Attributes_warehouseRackId", // Name of the index
        unique: false, // Index is not unique
      }
    );

    /**Master_Warehouse_Racks*/
    await queryInterface.addConstraint("Master_Warehouse_Racks", {
      fields: ["warehouseId"],
      type: "foreign key",
      name: "fk_Master_Warehouse_Racks_warehouseId",
      references: {
        table: "Master_Warehouses", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex(
      "Master_Warehouse_Racks",
      ["warehouseId"],
      {
        name: "idx_Master_Warehouse_Racks_warehouseId", // Name of the index
        unique: false, // Index is not unique
      }
    );
  },

  async down(queryInterface, Sequelize) {
    /**Master_Product_Transformations */
    await queryInterface.removeConstraint(
      "Master_Product_Transformations",
      "fk_Master_Product_Transformations_masterProductId"
    );
    await queryInterface.removeIndex(
      "Master_Product_Transformations",
      "idx_Master_Product_Transformations_masterProductId"
    );
    await queryInterface.removeConstraint(
      "Master_Product_Transformations",
      "fk_Master_Product_Transformations_unitFromId"
    );
    await queryInterface.removeConstraint(
      "Master_Product_Transformations",
      "fk_Master_Product_Transformations_unitToId"
    );
    await queryInterface.removeConstraint(
      "Master_Product_Transformations",
      "fk_Master_Product_Transformations_createdBy"
    );

    /**Master_Products*/
    await queryInterface.removeConstraint(
      "Master_Products",
      "fk_Master_Products_categoryId"
    );
    await queryInterface.removeIndex(
      "Master_Products",
      "idx_Master_Products_categoryId"
    );
    await queryInterface.removeConstraint(
      "Master_Products",
      "fk_Master_Products_typeId"
    );
    await queryInterface.removeIndex(
      "Master_Products",
      "idx_Master_Products_typeId"
    );
    await queryInterface.removeConstraint(
      "Master_Products",
      "fk_Master_Products_companyId"
    );
    await queryInterface.removeIndex(
      "Master_Products",
      "idx_Master_Products_companyId"
    );

    /**Master_Users*/
    await queryInterface.removeConstraint(
      "Master_Users",
      "fk_Master_Users_roleId"
    );
    await queryInterface.removeIndex("Master_Users", "idx_Master_Users_roleId");

    /**Master_Warehouse_Rack_Attributes*/
    await queryInterface.removeConstraint(
      "Master_Warehouse_Rack_Attributes",
      "fk_Master_Warehouse_Rack_Attributes_warehouseRackId"
    );
    await queryInterface.removeIndex(
      "Master_Warehouse_Rack_Attributes",
      "idx_Master_Warehouse_Rack_Attributes_warehouseRackId"
    );

    /**Master_Warehouse_Racks*/
    await queryInterface.removeConstraint(
      "Master_Warehouse_Racks",
      "fk_Master_Warehouse_Racks_warehouseId"
    );
    await queryInterface.removeIndex(
      "Master_Warehouse_Racks",
      "idx_Master_Warehouse_Racks_warehouseId"
    );
  },
};
