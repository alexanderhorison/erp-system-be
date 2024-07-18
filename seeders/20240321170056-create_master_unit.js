'use strict';
let unit = require("../data/master/unit.json")
unit.forEach(item => {
  item.createdAt = new Date(),
  item.updatedAt = new Date()
})
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Master_Units', unit, {})
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Master_Units', null, {})
  }
};
