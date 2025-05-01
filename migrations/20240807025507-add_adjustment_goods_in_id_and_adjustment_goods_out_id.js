'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.addColumn('Stock_Adjustment_Histories', 'adjustmentGoodsInId', {
      type: Sequelize.INTEGER
    });
    await queryInterface.addColumn('Stock_Adjustment_Histories', 'adjustmentGoodsOutId', {
      type: Sequelize.INTEGER
    });

  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.removeColumn('Stock_Adjustment_Histories', 'adjustmentGoodsInId');

    await queryInterface.removeColumn('Stock_Adjustment_Histories', 'adjustmentGoodsOutId');
  }
};
