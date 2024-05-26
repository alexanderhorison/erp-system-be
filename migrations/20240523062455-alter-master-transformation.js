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
    await queryInterface.addColumn(
      "Master_Transformations",
      "product_transformation_id",
      {
        type: Sequelize.STRING,
        allowNull: false,
      },
    );
    await queryInterface.addIndex("Master_Transformations", ["product_transformation_id"], {
      unique: false,
    });
    await queryInterface.addIndex("Delivery_Orders", ["delivery_order_id"], {
      unique: false,
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeIndex('Delivery_Orders', ['delivery_order_id']);
    await queryInterface.removeIndex('Master_Transformations', ['product_transformation_id']);
    await queryInterface.removeColumn(
      "Master_Transformations",
      "product_transformation_id"
    );
  },
};
