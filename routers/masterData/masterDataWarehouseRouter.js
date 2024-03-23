const router = require("express").Router();
const MasterDataWarehouseController = require("../../controllers/masterData/MasterDataWarehouseController");

router.get("/all", MasterDataWarehouseController.getAllWarehouse);
router.post("/create", MasterDataWarehouseController.createWarehouse);

router.put("/:warehouseId", MasterDataWarehouseController.updateWarehouse);
router.get("/:warehouseId", MasterDataWarehouseController.getDetailWarehouse);
router.delete("/:warehouseId", MasterDataWarehouseController.deleteWarehouse);


module.exports = router;
