'use strict';
let type = require("../data/master/type.json")
type.forEach(item => {
  item.createdAt = new Date(),
  item.updatedAt = new Date()
})
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Master_Types', type, {})
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Master_Types', null, {})
  }
};
