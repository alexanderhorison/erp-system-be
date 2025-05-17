const router = require("express").Router();
const DailyCostController = require("../../controllers/dailyCost/DailyCostController");

// Create daily cost
router.post("/create", DailyCostController.createDailyCost);

// Get detail daily cost
router.get("/detail/:date", DailyCostController.getDetailDailyCost);

// Get all daily costs
router.get("/all", DailyCostController.getAllDailyCosts);

// Get daily cost by date
router.get("/by-date", DailyCostController.getDailyCostByDate);

// Update daily cost
router.put("/:date", DailyCostController.updateDailyCost);

// Delete daily cost
router.delete("/:date", DailyCostController.deleteDailyCost);

module.exports = router;