"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch all menus
    const menus = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Menus";`,
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
      "Roles",
      [
        {
          name: "Admin",
          description: "administrator",
          MenuId: menuAdmin,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Kepala Gudang",
          description: "kepala gudang",
          MenuId: menuKepalaGudang,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Admin Gudang",
          description: "admin gudang",
          MenuId: menuAdminGudang,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Roles",
      { name: ["Admin", "Kepala Gudang", "Admin Gudang"] },
      {}
    );
  },
};
