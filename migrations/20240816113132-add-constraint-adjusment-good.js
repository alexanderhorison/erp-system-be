"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**Adjustment_Goods_In_Products */
    await queryInterface.addConstraint("Adjustment_Goods_In_Products", {
      fields: ["createdBy"],
      type: "foreign key",
      name: "fk_Adjustment_Goods_In_Products_createdBy",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addConstraint("Adjustment_Goods_In_Products", {
      fields: ["adjustmentGoodsInId"],
      type: "foreign key",
      name: "fk_Adjustment_Goods_In_Products_adjustmentGoodsInId",
      references: {
        table: "Adjustment_Goods_Ins", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addConstraint("Adjustment_Goods_In_Products", {
      fields: ["warehouseProductId"],
      type: "foreign key",
      name: "fk_Adjustment_Goods_In_Products_warehouseProductId",
      references: {
        table: "Warehouse_Products", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex(
      "Adjustment_Goods_In_Products",
      ["adjustmentGoodsInId"],
      {
        name: "idx_Adjustment_Goods_In_Products_adjustmentGoodsInId", // Name of the index
        unique: false, // Index is not unique
      }
    );
    await queryInterface.addIndex(
      "Adjustment_Goods_In_Products",
      ["warehouseProductId"],
      {
        name: "idx_Adjustment_Goods_In_Products_warehouseProductId", // Name of the index
        unique: false, // Index is not unique
      }
    );

    /**------------------------------------------------------------ */
    /**Adjustment_Goods_Ins */
    await queryInterface.addConstraint("Adjustment_Goods_Ins", {
      fields: ["warehouseDestinationId"],
      type: "foreign key",
      name: "fk_Adjustment_Goods_Ins_warehouseDestinationId",
      references: {
        table: "Master_Warehouses", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Update behavior
      onDelete: "RESTRICT",
    });

    // Add index on 'warehouseDestinationId'
    await queryInterface.addIndex(
      "Adjustment_Goods_Ins",
      ["warehouseDestinationId"],
      {
        name: "idx_Adjustment_Goods_Ins_warehouseDestinationId", // Name of the index
        unique: false, // Index is not unique
      }
    );

    // Add foreign key constraint on 'createdBy'
    await queryInterface.addConstraint("Adjustment_Goods_Ins", {
      fields: ["createdBy"],
      type: "foreign key",
      name: "fk_Adjustment_Goods_Ins_createdBy",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Update behavior
      onDelete: "RESTRICT",
    });

    // Add foreign key constraint on 'approvedBy'
    await queryInterface.addConstraint("Adjustment_Goods_Ins", {
      fields: ["approvedBy"],
      type: "foreign key",
      name: "fk_Adjustment_Goods_Ins_approvedBy",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Update behavior
      onDelete: "RESTRICT",
    });

    // Add foreign key constraint on 'deletedBy'
    await queryInterface.addConstraint("Adjustment_Goods_Ins", {
      fields: ["deletedBy"],
      type: "foreign key",
      name: "fk_Adjustment_Goods_Ins_deletedBy",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Update behavior
      onDelete: "RESTRICT",
    });

    // ---------------------------------------------------------------- //
    /**Adjustment_Goods_Outs */
    await queryInterface.addConstraint("Adjustment_Goods_Outs", {
      fields: ["warehouseOriginId"],
      type: "foreign key",
      name: "fk_Adjustment_Goods_Outs_warehouseOriginId",
      references: {
        table: "Master_Warehouses", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Update behavior
      onDelete: "RESTRICT",
    });

    // Add index on 'warehouseOriginId'
    await queryInterface.addIndex(
      "Adjustment_Goods_Outs",
      ["warehouseOriginId"],
      {
        name: "idx_Adjustment_Goods_Outs_warehouseOriginId", // Name of the index
        unique: false, // Index is not unique
      }
    );

    // Add foreign key constraint on 'createdBy'
    await queryInterface.addConstraint("Adjustment_Goods_Outs", {
      fields: ["createdBy"],
      type: "foreign key",
      name: "fk_Adjustment_Goods_Outs_createdBy",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Update behavior
      onDelete: "RESTRICT",
    });

    // Add foreign key constraint on 'approvedBy'
    await queryInterface.addConstraint("Adjustment_Goods_Outs", {
      fields: ["approvedBy"],
      type: "foreign key",
      name: "fk_Adjustment_Goods_Outs_approvedBy",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Update behavior
      onDelete: "RESTRICT",
    });

    // Add foreign key constraint on 'deletedBy'
    await queryInterface.addConstraint("Adjustment_Goods_Outs", {
      fields: ["deletedBy"],
      type: "foreign key",
      name: "fk_Adjustment_Goods_Outs_deletedBy",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Update behavior
      onDelete: "RESTRICT",
    });

    // ---------------------------------------------------------------- //
    /**Adjustment_Goods_Outs_Products */
    await queryInterface.addConstraint("Adjustment_Goods_Out_Products", {
      fields: ["createdBy"],
      type: "foreign key",
      name: "fk_Adjustment_Goods_Out_Products_createdBy",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addConstraint("Adjustment_Goods_Out_Products", {
      fields: ["adjustmentGoodsOutId"],
      type: "foreign key",
      name: "fk_Adjustment_Goods_Out_Products_adjustmentGoodsOutId",
      references: {
        table: "Adjustment_Goods_Outs", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addConstraint("Adjustment_Goods_Out_Products", {
      fields: ["warehouseProductId"],
      type: "foreign key",
      name: "fk_Adjustment_Goods_Out_Products_warehouseProductId",
      references: {
        table: "Warehouse_Products", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex(
      "Adjustment_Goods_Out_Products",
      ["adjustmentGoodsOutId"],
      {
        name: "idx_Adjustment_Goods_Out_Products_adjustmentGoodsOutId", // Name of the index
        unique: false, // Index is not unique
      }
    );
    await queryInterface.addIndex(
      "Adjustment_Goods_Out_Products",
      ["warehouseProductId"],
      {
        name: "idx_Adjustment_Goods_Out_Products_warehouseProductId", // Name of the index
        unique: false, // Index is not unique
      }
    );
  },

  async down(queryInterface, Sequelize) {
    /**Adjustment_Goods_In_Products*/
    await queryInterface.removeConstraint(
      "Adjustment_Goods_In_Products",
      "fk_Adjustment_Goods_In_Products_adjustmentGoodsInId"
    );
    await queryInterface.removeIndex(
      "Adjustment_Goods_In_Products",
      "idx_Adjustment_Goods_In_Products_adjustmentGoodsInId"
    );
    await queryInterface.removeIndex(
      "Adjustment_Goods_In_Products",
      "idx_Adjustment_Goods_In_Products_warehouseProductId"
    );
    await queryInterface.removeConstraint(
      "Adjustment_Goods_In_Products",
      "fk_Adjustment_Goods_In_Products_warehouseProductId"
    );
    await queryInterface.removeConstraint(
      "Adjustment_Goods_In_Products",
      "fk_Adjustment_Goods_In_Products_createdBy"
    );

    /**Adjustment_Goods_Ins */
    await queryInterface.removeConstraint(
      "Adjustment_Goods_Ins",
      "fk_Adjustment_Goods_Ins_deletedBy"
    );
    await queryInterface.removeConstraint(
      "Adjustment_Goods_Ins",
      "fk_Adjustment_Goods_Ins_approvedBy"
    );
    await queryInterface.removeConstraint(
      "Adjustment_Goods_Ins",
      "fk_Adjustment_Goods_Ins_createdBy"
    );
    await queryInterface.removeConstraint(
      "Adjustment_Goods_Ins",
      "fk_Adjustment_Goods_Ins_warehouseDestinationId"
    );
    await queryInterface.removeIndex(
      "Adjustment_Goods_Ins",
      "idx_Adjustment_Goods_Ins_warehouseDestinationId"
    );

    /**Adjustment_Goods_Outs */
    await queryInterface.removeConstraint(
      "Adjustment_Goods_Outs",
      "fk_Adjustment_Goods_Outs_deletedBy"
    );
    await queryInterface.removeConstraint(
      "Adjustment_Goods_Outs",
      "fk_Adjustment_Goods_Outs_approvedBy"
    );
    await queryInterface.removeConstraint(
      "Adjustment_Goods_Outs",
      "fk_Adjustment_Goods_Outs_createdBy"
    );
    await queryInterface.removeConstraint(
      "Adjustment_Goods_Outs",
      "fk_Adjustment_Goods_Outs_warehouseOriginId"
    );
    await queryInterface.removeIndex(
      "Adjustment_Goods_Outs",
      "idx_Adjustment_Goods_Outs_warehouseOriginId"
    );

    /**Adjustment_Goods_Out_Products*/
    await queryInterface.removeConstraint(
      "Adjustment_Goods_Out_Products",
      "fk_Adjustment_Goods_Out_Products_adjustmentGoodsOutId"
    );
    await queryInterface.removeIndex(
      "Adjustment_Goods_Out_Products",
      "idx_Adjustment_Goods_Out_Products_adjustmentGoodsOutId"
    );
    await queryInterface.removeIndex(
      "Adjustment_Goods_Out_Products",
      "idx_Adjustment_Goods_Out_Products_warehouseProductId"
    );
    await queryInterface.removeConstraint(
      "Adjustment_Goods_Out_Products",
      "fk_Adjustment_Goods_Out_Products_warehouseProductId"
    );
    await queryInterface.removeConstraint(
      "Adjustment_Goods_Out_Products",
      "fk_Adjustment_Goods_Out_Products_createdBy"
    );
  },
};
