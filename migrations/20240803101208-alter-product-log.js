'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("Product_Logs", "productId", {
      type: Sequelize.INTEGER,
    });
    await queryInterface.addIndex("Product_Logs", ["productId"], {
      unique: false,
    });
    await queryInterface.renameColumn('Master_Product_Transformations', 'productTransformationId', 'code');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Master_Product_Transformations', 'code', 'productTransformationId');
    await queryInterface.removeIndex('Product_Logs', ['productId']);
    await queryInterface.removeColumn("Product_Logs", "productId");
  }
};
