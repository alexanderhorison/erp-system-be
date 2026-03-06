const router = require("express").Router();
const ConfigController = require("../../controllers/config/configController");
const multer = require('multer');
const ALLOWED_FILE_TYPES = /jpeg|jpg|png|pdf|xlsx|xls/;
const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = ALLOWED_FILE_TYPES.test(file.originalname.toLowerCase().split(".").pop());
    const mime = ALLOWED_FILE_TYPES.test(file.mimetype.split("/").pop());
    if (ext || mime) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png, .pdf, .xlsx, .xls files are allowed"));
    }
  },
});

router.post("/all", ConfigController.getAllConfig);
router.post("/create", ConfigController.createConfig);
router.post("/detail", ConfigController.getConfig);
router.post("/update/:id", upload.single('logo'), ConfigController.updateConfig);
router.post("/bulk-update", ConfigController.bulkUpdateConfig);
router.delete("/delete", ConfigController.deleteConfig);

module.exports = router;
