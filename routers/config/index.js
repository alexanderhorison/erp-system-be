const router = require("express").Router();
const ConfigController = require("../../controllers/config/configController");
const multer = require('multer');
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } });

router.post("/all", ConfigController.getAllConfig);
router.post("/create", ConfigController.createConfig);
router.post("/detail", ConfigController.getConfig);
router.post("/update/:id", upload.single('logo'), ConfigController.updateConfig);
router.post("/bulk-update", ConfigController.bulkUpdateConfig);
router.delete("/delete", ConfigController.deleteConfig);

module.exports = router;
