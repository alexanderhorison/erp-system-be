const router = require("express").Router();
const MasterDataUnitController = require("../../controllers/master_data/MasterDataUnitController");

router.get("/all", MasterDataUnitController.getAllUnit);
router.post("/create", MasterDataUnitController.createUnit);

router.put("/:unitId", MasterDataUnitController.updateUnit);
router.get("/:unitId", MasterDataUnitController.getDetailUnit);
router.delete("/:unitId", MasterDataUnitController.deleteUnit);


module.exports = router;
