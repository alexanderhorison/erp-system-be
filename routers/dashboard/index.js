const router = require("express").Router();
const DashboardController = require("../../controllers/dashboard/DashboardController");

router.get("/minimum-stock", DashboardController.minimumStock);
router.get("/slow-stock", DashboardController.slowStock);
router.get("/fast-stock", DashboardController.fastStock);
router.get("/max-quantity-by-unit", DashboardController.maxQuantityByUnit);
router.get("/total-product-in-warehouse", DashboardController.totalProductInWarehouse);
router.get("/total-quantity-by-unit-in-warehouse", DashboardController.totalQuantityByUnitInWarehouse);
router.get("/total-surat", DashboardController.totalSurat);
router.get("/total-surat-pending", DashboardController.totalSuratPending);

module.exports = router;
