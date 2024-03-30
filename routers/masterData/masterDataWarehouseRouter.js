const router = require("express").Router();
const MasterDataWarehouseController = require("../../controllers/masterData/MasterDataWarehouseController");

router.get("/all", MasterDataWarehouseController.getAllWarehouse);
router.post("/create", MasterDataWarehouseController.createWarehouse);

router.put("/:id", MasterDataWarehouseController.updateWarehouse);
router.get("/:id", MasterDataWarehouseController.getDetailWarehouse);
router.delete("/:id", MasterDataWarehouseController.deleteWarehouse);


module.exports = router;
