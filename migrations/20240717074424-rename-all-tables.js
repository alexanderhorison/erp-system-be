'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameTable('Categories', 'Master_Categories');
    await queryInterface.renameTable('Companies', 'Master_Companies');
    await queryInterface.renameTable('Master_Product_Histories', 'Product_Logs');
    await queryInterface.renameTable('Master_Transformations', 'Master_Product_Transformations');
    await queryInterface.renameTable('Menus', 'Master_Menus');
    await queryInterface.renameTable('Product_Delivery_Order', 'Delivery_Order_Products');
    await queryInterface.renameTable('Product_Warehouses', 'Warehouse_Products');
    await queryInterface.renameTable('Roles', 'Master_Roles');
    await queryInterface.renameTable('Types', 'Master_Types');
    await queryInterface.renameTable('Units', 'Master_Units');
    await queryInterface.renameTable('Users', 'Master_Users');
    await queryInterface.renameTable('Warehouses', 'Master_Warehouses');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameTable('Master_Categories', 'Categories');
    await queryInterface.renameTable('Master_Companies', 'Companies');
    await queryInterface.renameTable('Product_Logs', 'Master_Product_Histories');
    await queryInterface.renameTable('Master_Product_Transformations', 'Master_Transformations');
    await queryInterface.renameTable('Master_Menus', 'Menus');
    await queryInterface.renameTable('Delivery_Order_Products', 'Product_Delivery_Order');
    await queryInterface.renameTable('Warehouse_Products', 'Product_Warehouses');
    await queryInterface.renameTable('Master_Roles', 'Roles');
    await queryInterface.renameTable('Master_Types', 'Types');
    await queryInterface.renameTable('Master_Units', 'Units');
    await queryInterface.renameTable('Master_Users', 'Users');
    await queryInterface.renameTable('Master_Warehouses', 'Warehouses');
  }
};
