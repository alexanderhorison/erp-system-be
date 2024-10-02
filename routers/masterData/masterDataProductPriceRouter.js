const MasterDataProductPriceController = require("../../controllers/masterData/MasterDataProductPriceController");
const router = require("express").Router();

router.get("/all", MasterDataProductPriceController.getAll);
router.post("/create", MasterDataProductPriceController.createOrUpdate);

module.exports = router;
