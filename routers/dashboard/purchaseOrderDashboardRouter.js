const PurchaseOrderDashboardController = require("../../controllers/dashboard/PurchaseOrderDashboardController");

const router = require("express").Router();

// 1. DashboardPo1: Top 5 Vendor yang total nominal PO nya paling bnyk
// 2. DashboardPo2: Top 5 Vendor yang total surat PO nya paling bnyk
// 3. DashboardPo3: Top 5 Vendor yang total hutang PO nya paling bnyk
// 4. DashboardPo4: Top 5 Vendor yang total barter PO nya paling bnyk
// 5. DashboardPo5: Grafik x = date , y = nominal PO per gudang
// 6. DashboardPo6: List 10 PO yang sudah lewat due date nya → pagination

router.get("/po1", PurchaseOrderDashboardController.getDashboardPo);
router.get("/po6", PurchaseOrderDashboardController.getDashboardPoListOverDueDate);

module.exports = router;