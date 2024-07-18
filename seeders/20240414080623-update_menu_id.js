"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch All menus
    const menus = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Master_Menus";`,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    // Function to execute Menu update
    const functionUpdate = async (menuId, menuName) => {
      await queryInterface.bulkUpdate(
        "Master_Menus",
        { menuId: menuId },
        { name: menuName }
      );
    };

    // Update menuId in table Menus
    menus.forEach(async (data) => {
      switch (data.name) {
        case "Pengguna":
          await functionUpdate(1, data.name);
          break;
        case "Otoritas Pengguna":
          await functionUpdate(2, data.name);
          break;
        case "Kategori Produk":
          await functionUpdate(3, data.name);
          break;
        case "Tipe Produk":
          await functionUpdate(4, data.name);
          break;
        case "Produk":
          await functionUpdate(5, data.name);
          break;
        case "Gudang":
          await functionUpdate(6, data.name);
          break;
        case "Rumus Transformasi":
          await functionUpdate(7, data.name);
          break;
        case "List Produk Gudang":
          await functionUpdate(8, data.name);
          break;
        case "Penyesuaian Stok Produk Gudang":
          await functionUpdate(9, data.name);
          break;
        case "Surat Jalan":
          await functionUpdate(10, data.name);
          break;
        case "Penerimaan Surat Jalan":
          await functionUpdate(11, data.name);
          break;
        default:
          break;
      }
    });
    // Insert Menu Satuan produk
    await queryInterface.insert(
      null,
      "Master_Menus",
      {
        name: "Satuan Produk",
        description: "Manajemen satuan produk",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 12,
      },
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Master_Menus", { name: "Satuan Produk" }, null);
    await queryInterface.bulkUpdate("Master_Menus", { menuId: null }, {});
  },
};
