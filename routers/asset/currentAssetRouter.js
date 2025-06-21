const router = require("express").Router();
const CurrentAssetController = require ("../../controllers/asset/CurrentAssetController");

router.get("/all", CurrentAssetController.getAll)

module.exports = router;