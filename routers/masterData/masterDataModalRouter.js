const router = require("express").Router();
const MasterDataModalControler = require("../../controllers/masterData/MasterDataModalControler");

router.post("/migrate-price-modal", MasterDataModalControler.migratePriceModal);
router.post("/force-update-modal", MasterDataModalControler.forceUpdateModal);
router.get("/:productId/:unitId", MasterDataModalControler.getOnePriceModal);

module.exports = router;
