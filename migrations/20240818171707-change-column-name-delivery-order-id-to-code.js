'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('Delivery_Orders', 'deliveryOrderId', 'code');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn('Delivery_Orders', 'code', 'deliveryOrderId');
  }
};
