'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Master_Menus",
      [
        {
          name: "Master Vendor",
          description: "Master Vendor",
          createdAt: new Date(),
          updatedAt: new Date(),
          menuId: 24,
        }
      ]
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.delete("Master_Menus", { name: "Master Vendor" }, {});
  }

};
