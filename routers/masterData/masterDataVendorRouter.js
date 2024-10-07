const MasterDataVendorController = require("../../controllers/masterData/MasterDataVendorController");
const router = require("express").Router();

router.get("/all", MasterDataVendorController.getAllVendor);
router.post("/create", MasterDataVendorController.createVendor);

router.put("/:id", MasterDataVendorController.updateVendor);
router.get("/:id", MasterDataVendorController.getDetailVendor);
router.delete("/:id", MasterDataVendorController.deleteVendor);

module.exports = router;
