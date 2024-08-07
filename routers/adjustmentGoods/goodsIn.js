const router = require("express").Router();

const GoodsInController = require("../../controllers/adjustmentGoods/GoodsInController");

router.get("/", GoodsInController.getAllGoodsIn);
router.post("/create", GoodsInController.createGoodsIn);
router.post("/approve/:code", GoodsInController.approveGoodsIn);
router.post("/reject/:code", GoodsInController.rejectGoodsIn);
router.get("/:code", GoodsInController.getDetailGoodsIn);

module.exports = router