'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Delivery_Orders', 'delivery_order_id', {
      type: Sequelize.STRING,
      allowNull: false
    });
    await queryInterface.addColumn('Product_Delivery_Order', 'delivery_order_id', {
      type: Sequelize.STRING,
      allowNull: false
    });
    await queryInterface.addColumn('Stock_Adjustment_Histories', 'delivery_order_id', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Delivery_Orders', 'delivery_order_id');
    await queryInterface.removeColumn('Product_Delivery_Order', 'delivery_order_id');
    await queryInterface.removeColumn('Stock_Adjustment_Histories', 'delivery_order_id');
  }
};
