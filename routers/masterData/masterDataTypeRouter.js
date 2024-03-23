const router = require("express").Router();
const MasterDataTypeController = require("../../controllers/masterData/MasterDataTypeController");

router.get("/all", MasterDataTypeController.getAllType);
router.post("/create", MasterDataTypeController.createType);

router.put("/:typeId", MasterDataTypeController.updateType);
router.get("/:typeId", MasterDataTypeController.getDetailType);
router.delete("/:typeId", MasterDataTypeController.deleteType);


module.exports = router;
