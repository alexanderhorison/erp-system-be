const router = require("express").Router();
const ShortTermController = require("../../controllers/liabilities/ShortTermController");

router.post("/", ShortTermController.createShortTermLiability);
router.get("/all", ShortTermController.getAllShortTermLiabilities);
router.get("/piutang-po", ShortTermController.getPiutangPo);

router.get("/:id", ShortTermController.getDetailShortTerm);
router.put("/:id", ShortTermController.updateShortterm);
router.delete("/:id", ShortTermController.deleteShortTerm);

module.exports = router;
