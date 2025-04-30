const router = require("express").Router();
const MasterEmployeeController = require("../../controllers/masterData/MasterDataEmployeeController");

router.get("/all", MasterEmployeeController.getAllEmployees);
router.post("/create", MasterEmployeeController.createEmployee);

router.put("/:id", MasterEmployeeController.updateEmployee);
router.get("/:id", MasterEmployeeController.getDetailEmployee);
router.delete("/:id", MasterEmployeeController.deleteEmployee);

module.exports = router;
