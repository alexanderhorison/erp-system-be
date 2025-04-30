'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Stock_Adjustment_Histories', 'stockOpnameId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Stock_Opnames',
        key: 'id'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Stock_Adjustment_Histories', 'stockOpnameId');
  }
};
