const router = require("express").Router();

const GoodsOutController = require("../../controllers/adjustmentGoods/GoodsOutController");


router.get("/", GoodsOutController.getAllGoodsOut);
router.post("/create", GoodsOutController.createGoodsOut);
router.post("/approve/:code", GoodsOutController.approveGoodsOut);
router.post("/reject/:code", GoodsOutController.rejectGoodsOut);
router.get("/:code", GoodsOutController.getDetailGoodsOut);
// router.put("/:code", GoodsOutController.updateGoodsOut);

module.exports = router;
