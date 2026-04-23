const router = require("express").Router();
const MasterDataShiftController = require("../../controllers/masterData/MasterDataShiftController");

router.get("/all", MasterDataShiftController.getAllShift);
router.post("/create", MasterDataShiftController.createShift);

router.put("/:id", MasterDataShiftController.updateShift);
router.get("/:id", MasterDataShiftController.getDetailShift);
router.delete("/:id", MasterDataShiftController.deleteShift);

module.exports = router;