const router = require("express").Router();
const routerCurrentAsset = require("./currentAssetRouter");
const routerNonCurrentAsset = require("./nonCurrentAssetRouter");

router.use("/current", routerCurrentAsset);
router.use("/non-current", routerNonCurrentAsset);

module.exports = router;