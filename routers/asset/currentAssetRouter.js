const router = require("express").Router();
const CurrentAssetController = require("../../controllers/asset/CurrentAssetController");

router.post("/", CurrentAssetController.createAsset);
router.get("/all", CurrentAssetController.getAll);
router.get("/:id", CurrentAssetController.getDetailAsset);
router.put("/:id", CurrentAssetController.updateAsset);

module.exports = router;
