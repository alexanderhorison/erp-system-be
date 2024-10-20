### Install All Dependencies

```
- npm install
```

```
Copy env.example to your local as .env
- Make sure FE and BE have same APP_SECRET_KEY
```

### UPDATE on Warehouse Rack (31 Juli 2024)

```
Ada update terhadap warehouse Rack dimana punya rak default, jika ada warehouse existing sebelumnya maka akan pasti mengalami error.
Update warehouseId sesuai yang di existing db

insert into "Master_Warehouse_Racks"
(name, description, "warehouseId", "createdAt", "updatedAt")
values
('default', 'default rak', 6, now(), now()),
('default', 'default rak', 4, now(), now()),
('default', 'default rak', 5, now(), now())

```

### STATUS LIST - updated (3 Agustus 2024)

```
APPROVED
PENDING
REJECTED
DRAFT
```

### List menu global (3 Agustus 2024)

== LIST MENU ==
menuId di BE disamakan dengan FE, sehingga bisa termapping dengan sesuai. Tidak menggunakan id karena auto increment, jadi manual developer define menu id nya

Jika ada penambahan menu, maka ditambahkan juga di FE

```
ID MENU : NAMA

1	  Pengguna	membuat pengguna dan otoritasnya
2	  Otoritas Pengguna	membuat otoritas pengguna dan menu yang bisa diakses
3	  Kategori Produk	manajemen kategori produk
4	  Tipe Produk	manajemen satuan produk
5	  Produk	manajemen produk
6	  Gudang	manajemen gudang
7	  Rumus Transformasi	manajemen rumus untuk mengubah satuan produk
8	  List Produk Gudang	melihat produk gudang, set lowstock alert dan transformasi ke satuan lebih kecil
9	  Penyesuaian Stok Produk Gudang	melihat produk gudang, menambahkan/mengurangi stok, set low stock alert
10  Surat Jalan	list surat jalan beserta status, membuat surat jalan dari warehouse ke warehouse lain
11  Penerimaan Surat Jalan	list surat jalan pending, menerima produk dari warehouse sumber dan input produk diterima
12  Satuan Produk	Manajemen satuan produk
13  Company	Manajemen Company Produk
15  Stock Opname
16  Barang Masuk
17  Barang Keluar
18  Internal Transfer
19  Outstanding Product (Produk yang selisih dari penerimaan surat jalan)
20  Dashboard
21  Customer
22  Rank
23  Sales Order
24  Master Vendor
25  Purchase Order
```

### API Migration (15 Agustus 2024)

Penambahan untuk api migration

```
1. Last Quantity (STOCK ADJUSTMENT HISTORY)
hit postman isi body dengan "MIGRATION LAST QUANTITY"
```
