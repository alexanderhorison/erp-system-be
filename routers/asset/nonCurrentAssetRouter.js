const router = require("express").Router();
const NonCurrentAssetController = require("../../controllers/asset/NonCurrentAssetController");

router.get("/all", NonCurrentAssetController.getAll);

module.exports = router;
