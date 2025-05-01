'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Master_Menus",
      [
        {
          name: "Outstanding Product",
          description: "Outstanding Product (Produk yang selisih dari penerimaan surat jalan)",
          createdAt: new Date(),
          updatedAt: new Date(),
          menuId: 19,
        }
      ]
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.delete("Master_Menus", { name: "Outstanding Product" }, {});
  }

};
