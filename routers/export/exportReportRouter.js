const ExportReportController = require("../../controllers/exportController/ExportReportController");
const router = require("express").Router();

router.get("/sales-order", ExportReportController.exportReportSo);

module.exports = router;
