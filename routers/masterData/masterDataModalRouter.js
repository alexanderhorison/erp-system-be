const router = require("express").Router();
const MasterDataModalControler = require("../../controllers/masterData/MasterDataModalControler");

router.get("/:productId/:unitId", MasterDataModalControler.getOnePriceModal);

module.exports = router;
