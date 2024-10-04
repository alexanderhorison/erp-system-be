const MasterDataProductPriceController = require("../../controllers/masterData/MasterDataProductPriceController");
const router = require("express").Router();

router.get("/all/:productId", MasterDataProductPriceController.getAll);
router.post("/create", MasterDataProductPriceController.createOrUpdate);
router.get("/:productId/:unitId", MasterDataProductPriceController.getOne);

module.exports = router;
