const router = require("express").Router();
const ConfigController = require("../../controllers/config/configController");

router.post("/all", ConfigController.getAllConfig);
router.post("/create", ConfigController.createConfig);
router.post("/detail", ConfigController.getConfig);
router.post("/update/:id", ConfigController.updateConfig);
router.post("/bulk-update", ConfigController.bulkUpdateConfig);
router.delete("/delete", ConfigController.deleteConfig);

module.exports = router;
