const MasterDataProductPriceController = require("../../controllers/masterData/MasterDataProductPriceController");
const router = require("express").Router();
const multer = require('multer');
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } });

router.get("/all/:productId", MasterDataProductPriceController.getAll);
router.post("/create", MasterDataProductPriceController.createOrUpdate);
router.get("/download-template", MasterDataProductPriceController.downloadTemplate);
router.post("/import-template", upload.single('file'), MasterDataProductPriceController.importTemplate);
router.get("/:productId/:unitId", MasterDataProductPriceController.getOne);

module.exports = router;
