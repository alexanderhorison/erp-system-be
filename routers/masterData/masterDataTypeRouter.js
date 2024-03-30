const router = require("express").Router();
const MasterDataTypeController = require("../../controllers/masterData/MasterDataTypeController");

router.get("/all", MasterDataTypeController.getAllType);
router.post("/create", MasterDataTypeController.createType);

router.put("/:id", MasterDataTypeController.updateType);
router.get("/:id", MasterDataTypeController.getDetailType);
router.delete("/:id", MasterDataTypeController.deleteType);


module.exports = router;
