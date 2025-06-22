const router = require("express").Router();
const MasterNonCurrentAssetController = require("../../controllers/asset/MasterNonCurrentAssetController");

router.get("/all", MasterNonCurrentAssetController.getAll);
router.post("/", MasterNonCurrentAssetController.create);
router.get("/:id", MasterNonCurrentAssetController.getById);
router.put("/:id", MasterNonCurrentAssetController.update);

module.exports = router;
