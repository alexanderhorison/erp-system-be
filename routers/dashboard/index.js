const router = require("express").Router();
const DashboardController = require("../../controllers/dashboard/DashboardController");

router.get("/minimum-stock", DashboardController.minimumStock);

module.exports = router;
