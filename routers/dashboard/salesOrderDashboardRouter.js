const SalesOrderDashboardController = require("../../controllers/dashboard/SalesOrderDashboardController");

const router = require("express").Router();

// 1. DashboardSo1: Top 5 Customer yang total nominal SO nya paling bnyk
// 2. DashboardSo2: Top 5 Customer yang total surat SO nya paling bnyk
// 3. DashboardSo3: Top 5 Customer yang total hutang SO nya paling bnyk
// 4. DashboardSo4: Top 5 Customer yang total barter SO nya paling bnyk
// 5. DashboardSo5: Grafik x = date , y = nominal SO per gudang
// 6. DashboardSo6: List 10 SO yang sudah lewat due date nya → pagination

router.get("/so1", SalesOrderDashboardController.getDashboardSo);
router.get("/so6", SalesOrderDashboardController.getDashboardSoListOverDueDate);
router.get("/menu", SalesOrderDashboardController.getDasboardMenuSalesOrder);
// router.get("/total-amount-sales-order", SalesOrderDashboardController.totalAmountSalesOrder);
// router.get("/total-amount-payment-sales-order", SalesOrderDashboardController.totalAmountPaymentSalesOrder);

module.exports = router;
