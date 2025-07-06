const router = require("express").Router();
const LongTermController = require("../../controllers/liabilities/LongTermController");

router.post("/", LongTermController.createLongTermLiability);
router.get("/all", LongTermController.getAllLongTermLiabilities);

router.get("/:id", LongTermController.getDetailLongTerm);
router.put("/:id", LongTermController.updateLongterm);
router.delete("/:id", LongTermController.deleteLongTerm);

module.exports = router;
