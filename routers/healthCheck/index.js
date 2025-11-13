const router = require("express").Router();

const PrinterHealthCheckController = require("../../controllers/healthCheck/printerHealthCheckController");

router.get("/printer", PrinterHealthCheckController.healthCheckAllPrinters);

module.exports = router;
