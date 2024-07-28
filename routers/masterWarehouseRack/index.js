const router = require("express").Router();
const MasterDataWarehouseController = require("../../controllers/masterData/MasterDataWarehouseController");

router.post("/create", MasterDataWarehouseController.createWarehouseRack);
router.get("/detail/:id", MasterDataWarehouseController.getDetailWarehouseRack);

router.get("/:warehouseId", MasterDataWarehouseController.getAllWarehouseRack);
router.put("/:id", MasterDataWarehouseController.updateWarehouseRack);
router.delete("/:id", MasterDataWarehouseController.deleteWarehouseRack);

module.exports = router;
