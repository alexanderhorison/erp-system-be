const router = require("express").Router();
const FinanceDashboardController = require("../../controllers/dashboard/FinanceDashboardController");

router.get("/revenue", FinanceDashboardController.getRevenue)
router.get("/profit-loss", FinanceDashboardController.getProfitLoss)
router.get("/profit-loss-yearly", FinanceDashboardController.getProfitLossYearly)

module.exports = router;