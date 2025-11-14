const router = require("express").Router();

const PrinterHealthCheckController = require("../../controllers/healthCheck/printerHealthCheckController");

router.get("/printer", PrinterHealthCheckController.healthCheckAllPrinters);
router.post("/printer/single", PrinterHealthCheckController.healthCheckSinglePrinter);
router.post("/printer/test-print", PrinterHealthCheckController.testPrint);

module.exports = router;
