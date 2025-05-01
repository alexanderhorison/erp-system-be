const router = require("express").Router();
const ExportController = require("../../controllers/exportController/ExportController");
const ExportReportController = require("../../controllers/exportController/ExportReportController");

// REPORT
router.get("/report", ExportReportController.exportReport);

// EXCEL
router.get("/all-stock/:warehouseId", ExportController.allStock)
router.get("/stock-opname/:code", ExportController.stockOpname);

// PEDF
router.get("/purchase-order/:code", ExportController.purchaseOrder);
router.get("/sales-order/:code", ExportController.salesOrder);
router.get("/delivery-order/:code", ExportController.deliveryOrder);
router.get("/delivery-order-receive/:code", ExportController.deliveryOrderReceive);
router.get("/delivery-order-receive-outstanding/:code", ExportController.deliveryOrderReceiveOutstanding);
router.get("/adjustment-goods-in/:code", ExportController.adjustmentGoodsIn);
router.get("/adjustment-goods-out/:code", ExportController.adjustmentGoodsOut);
router.get("/internal-transfer/:code", ExportController.internalTransfer);
module.exports = router;