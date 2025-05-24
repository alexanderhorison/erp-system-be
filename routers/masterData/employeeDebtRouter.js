const router = require("express").Router();
const MasterEmployeeController = require("../../controllers/masterData/MasterDataEmployeeController");

router.post("/:id", MasterEmployeeController.createTrxEmployeeDebt);
router.get("/:id", MasterEmployeeController.getAllTrxEmployeeDebt);
router.delete("/:id", MasterEmployeeController.deleteTrxEmployeeDebt);

module.exports = router;