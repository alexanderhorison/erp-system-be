'use strict';
let product = require("../data/master/product.json")
product.forEach(item => {
  item.createdAt = new Date(),
  item.updatedAt = new Date()
})
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Master_Products', product, {})
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Master_Products', null, {})
  }
};
