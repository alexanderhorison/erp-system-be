const router = require("express").Router();
const ConfigController = require("../../controllers/config/configController");

router.post("/create", ConfigController.createConfig);
router.post("/detail", ConfigController.getConfig);
router.post("/update", ConfigController.updateConfig);

module.exports = router;
