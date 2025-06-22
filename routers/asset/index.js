const router = require("express").Router();
const routerCurrentAsset = require("./currentAssetRouter");
const routerMasterNonCurrentAsset = require("./masterNonCurentAssetRouter")
const routerNonCurrentAsset = require("./nonCurrentAssetRouter");

router.use("/current", routerCurrentAsset);
router.use("/non-current", routerNonCurrentAsset);
router.use("/master-non-current", routerMasterNonCurrentAsset);

module.exports = router;