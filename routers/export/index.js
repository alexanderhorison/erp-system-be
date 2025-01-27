const router = require("express").Router();
const ExportController = require("../../controllers/exportController/ExportController");

router.get("/", ExportController.testing2);

module.exports = router;
