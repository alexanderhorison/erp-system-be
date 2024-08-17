'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addConstraint("Stock_Adjustment_Histories", {
      fields: ["productWarehouseId"],
      type: "foreign key",
      name: "fk_Stock_Adjustment_Histories_productWarehouseId",
      references: {
        table: "Warehouse_Products", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex("Stock_Adjustment_Histories", ["productWarehouseId"], {
      name: "idx_Stock_Adjustment_Histories_productWarehouseId", // Name of the index
      unique: false, // Index is not unique
    });
    await queryInterface.addConstraint("Stock_Adjustment_Histories", {
      fields: ["warehouseId"],
      type: "foreign key",
      name: "fk_Stock_Adjustment_Histories_warehouseId",
      references: {
        table: "Master_Warehouses", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex("Stock_Adjustment_Histories", ["warehouseId"], {
      name: "idx_Stock_Adjustment_Histories_warehouseId", // Name of the index
      unique: false, // Index is not unique
    });

    await queryInterface.addConstraint("Stock_Adjustment_Histories", {
      fields: ["adjustmentGoodsOutId"],
      type: "foreign key",
      name: "fk_Stock_Adjustment_Histories_adjustmentGoodsOutId",
      references: {
        table: "Adjustment_Goods_Outs", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addConstraint("Stock_Adjustment_Histories", {
      fields: ["adjustmentGoodsInId"],
      type: "foreign key",
      name: "fk_Stock_Adjustment_Histories_adjustmentGoodsInId",
      references: {
        table: "Adjustment_Goods_Ins", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
    await queryInterface.addConstraint("Stock_Adjustment_Histories", {
      fields: ["userId"],
      type: "foreign key",
      name: "fk_Stock_Adjustment_Histories_userId",
      references: {
        table: "Master_Users", // The referenced table
        field: "id", // The column in the referenced table
      },
      onUpdate: "CASCADE", // Optional: Specify action on update
      onDelete: "RESTRICT",
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "Stock_Adjustment_Histories",
      "fk_Stock_Adjustment_Histories_productWarehouseId"
    );
    await queryInterface.removeIndex(
      "Stock_Adjustment_Histories",
      "idx_Stock_Adjustment_Histories_productWarehouseId"
    );
    await queryInterface.removeConstraint(
      "Stock_Adjustment_Histories",
      "fk_Stock_Adjustment_Histories_warehouseId"
    );
    await queryInterface.removeIndex(
      "Stock_Adjustment_Histories",
      "idx_Stock_Adjustment_Histories_warehouseId"
    );
    await queryInterface.removeConstraint(
      "Stock_Adjustment_Histories",
      "fk_Stock_Adjustment_Histories_adjustmentGoodsInId"
    );
    await queryInterface.removeConstraint(
      "Stock_Adjustment_Histories",
      "fk_Stock_Adjustment_Histories_adjustmentGoodsOutId"
    );
    await queryInterface.removeConstraint(
      "Stock_Adjustment_Histories",
      "fk_Stock_Adjustment_Histories_userId"
    );
  }
};
