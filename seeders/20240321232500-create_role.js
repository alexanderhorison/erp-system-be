"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch all menus
    const menus = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Master_Menus";`,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    let menuAdmin = [];
    let menuKepalaGudang = [];
    let menuAdminGudang = [];
    menus.forEach((data) => {
      menuAdmin.push(data.id);
      switch (data.name) {
        case "List Produk Gudang":
          menuKepalaGudang.push(data.id);
          menuAdminGudang.push(data.id);
          break;
        case "Penyesuaian Stok Produk Gudang":
        case "Surat Jalan":
          menuKepalaGudang.push(data.id);
          break;
        case "Penerimaan Surat Jalan":
          menuAdminGudang.push(data.id);
          break;
        default:
          break;
      }
    });
    await queryInterface.bulkInsert(
      "Master_Roles",
      [
        {
          name: "Admin",
          description: "administrator",
          menuId: menuAdmin,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Kepala Gudang",
          description: "kepala gudang",
          menuId: menuKepalaGudang,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Admin Gudang",
          description: "admin gudang",
          menuId: menuAdminGudang,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Master_Roles",
      { name: ["Admin", "Kepala Gudang", "Admin Gudang"] },
      {}
    );
  },
};
