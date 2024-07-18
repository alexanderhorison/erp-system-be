'use strict';
let category = require("../data/master/category.json")
category.forEach(item => {
  item.createdAt = new Date(),
  item.updatedAt = new Date()
})
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Master_Categories', category, {})
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Master_Categories', null, {})
  }
};
