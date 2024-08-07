const router = require("express").Router();
const routerGoodsIn = require("./goodsIn")
const routerGoodsOut = require("./goodsOut")

router.use("/in", routerGoodsIn);
router.use("/out", routerGoodsOut);

module.exports = router;
