const router = require("express").Router();
const MasterDataUnitController = require("../../controllers/masterData/MasterDataUnitController");

router.get("/all", MasterDataUnitController.getAllUnit);
router.post("/create", MasterDataUnitController.createUnit);

router.put("/:id", MasterDataUnitController.updateUnit);
router.get("/:id", MasterDataUnitController.getDetailUnit);
router.delete("/:id", MasterDataUnitController.deleteUnit);


module.exports = router;
