'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Master_Menus",
      [
        {
          name: "Printer Setting",
          description: "Printer Setting",
          createdAt: new Date(),
          updatedAt: new Date(),
          menuId: 28,
        }
      ]
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.delete("Master_Menus", { name: "Printer Setting" }, {});
  }
};
