'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Master_Menus",
      [
        {
          name: "Deleted Product",
          description: "Deleted Product",
          createdAt: new Date(),
          updatedAt: new Date(),
          menuId: 26,
        }
      ]
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.delete("Master_Menus", { name: "Deleted Product" }, {});
  }
};
