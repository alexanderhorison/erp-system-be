const router = require("express").Router();
const DashboardController = require("../../controllers/dashboard/DashboardController");

// 1. DashboardBarangHabis.js
router.get("/minimum-stock", DashboardController.minimumStock);
// 2. DashboardBarangTidakBergerak.js
router.get("/slow-stock", DashboardController.slowStock);
// 3. DashboardBarangCepat.js
router.get("/fast-stock", DashboardController.fastStock);
// 4. DashboardBarangQuantityTerbanyak.js
router.get("/max-quantity-by-unit", DashboardController.maxQuantityByUnit);
// 5. DashboardTotalQuantityPerUnit.js
router.get("/total-product-in-warehouse", DashboardController.totalProductInWarehouse);
// 6. DashboardJumlahSurat.js
router.get("/total-surat", DashboardController.totalSurat);
// 7. DashboardJumlahSuratPending.js
router.get("/total-surat-pending", DashboardController.totalSuratPending);
// 8. DashboardProductBanyakHilang.js
router.get('/most-lost-product-outstanding', DashboardController.listMostLostProductAtOutstanding)
// 9. DashboardProductQuantityBanyakHilang.js
router.get('/most-lost-quantity-product-outstanding', DashboardController.listMostLostProductAtOutstandingByQuantity)


module.exports = router;

// ======================================================================
// 1. DashboardBarangHabis.js
// 2. DashboardBarangTidakBergerak.js
// 3. DashboardBarangCepat.js
// 4. DashboardBarangQuantityTerbanyak.js
// 5. DashboardTotalQuantityPerUnit.js
// 6. DashboardJumlahSurat.js
// 7. DashboardJumlahSuratPending.js
// 8. DashboardProductBanyakHilang.js
// 9. DashboardProductQuantityBanyakHilang.js