const router = require("express").Router();
const EquityController = require("../../controllers/equity/EquityController");

router.post("/", EquityController.createEquity);
router.get("/all", EquityController.getAllEquities);

router.get("/:id", EquityController.getDetailEquity);
router.put("/:id", EquityController.updateEquity);
router.delete("/:id", EquityController.deleteEquity);

module.exports = router;
