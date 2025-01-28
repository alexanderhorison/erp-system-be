const router = require("express").Router();
const ExportController = require("../../controllers/exportController/ExportController");

router.get("/purchase-order/:code", ExportController.purchaseOrder);
router.get("/sales-order/:code", ExportController.salesOrder);


router.get("/testing/:code", ExportController.testing);
module.exports = router;
