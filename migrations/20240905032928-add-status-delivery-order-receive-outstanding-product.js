'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Delivery_Order_Receipt_Outstanding_Products', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'outstanding'
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Delivery_Order_Receipt_Outstanding_Products', 'status')
  }

};
