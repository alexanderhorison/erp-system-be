'use strict';
let warehouse = require("../data/master/warehouse.json")
warehouse.forEach(item => {
  item.createdAt = new Date(),
  item.updatedAt = new Date()
})
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Warehouses', warehouse, {})
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Warehouses', null, {})
  }
};
