"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const menus = [
      {
        name: "Pengguna",
        description: "membuat pengguna dan otoritasnya",
      },
      {
        name: "Otoritas Pengguna",
        description: "membuat otoritas pengguna dan menu yang bisa diakses",
      },
      {
        name: "Kategori Produk",
        description: "manajemen kategori produk",
      },
      {
        name: "Tipe Produk",
        description: "manajemen satuan produk",
      },
      {
        name: "Produk",
        description: "manajemen produk",
      },
      {
        name: "Gudang",
        description: "manajemen gudang",
      },
      {
        name: "Rumus Transformasi",
        description: "manajemen rumus untuk mengubah satuan produk",
      },
      {
        name: "List Produk Gudang",
        description:
          "melihat produk gudang, set lowstock alert dan transformasi ke satuan lebih kecil",
      },
      {
        name: "Penyesuaian Stok Produk Gudang",
        description:
          "melihat produk gudang, menambahkan/mengurangi stok, set low stock alert",
      },
      {
        name: "Surat Jalan",
        description:
          "list surat jalan beserta status, membuat surat jalan dari warehouse ke warehouse lain",
      },
      {
        name: "Penerimaan Surat Jalan",
        description:
          "list surat jalan pending, menerima produk dari warehouse sumber dan input produk diterima",
      },
    ];
    menus.forEach((menu) => {
      menu.createdAt = new Date();
      menu.updatedAt = new Date();
    });
    await queryInterface.bulkInsert("Menus", menus, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Menus",
      {
        name: [
          "Pengguna",
          "Otoritas Pengguna",
          "Kategori Produk",
          "Tipe Produk",
          "Produk",
          "Gudang",
          "Rumus Transformasi",
          "List Produk Gudang",
          "Penyesuaian Stok Produk Gudang",
          "Surat Jalan",
          "Penerimaan Surat Jalan",
        ],
      },
      {}
    );
  },
};
