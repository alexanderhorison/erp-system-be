const MasterDataProductPriceController = require("../../controllers/masterData/MasterDataProductPriceController");
const router = require("express").Router();
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

router.get("/all/:productId", MasterDataProductPriceController.getAll);
router.post("/create", MasterDataProductPriceController.createOrUpdate);
router.get("/download-template", MasterDataProductPriceController.downloadTemplate);
router.post("/import-template", upload.single('file'), MasterDataProductPriceController.importTemplate);
router.get("/:productId/:unitId", MasterDataProductPriceController.getOne);

module.exports = router;
