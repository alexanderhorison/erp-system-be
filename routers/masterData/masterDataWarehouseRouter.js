const router = require("express").Router();
const MasterDataWarehouseController = require("../../controllers/masterData/MasterDataWarehouseController");
const routerMasterWarehouseRack = require("../masterWarehouseRack")

router.get("/all", MasterDataWarehouseController.getAllWarehouse);
router.post("/create", MasterDataWarehouseController.createWarehouse);

router.use('/warehouse-rack', routerMasterWarehouseRack)

router.put("/:id", MasterDataWarehouseController.updateWarehouse);
router.get("/:id", MasterDataWarehouseController.getDetailWarehouse);
router.delete("/:id", MasterDataWarehouseController.deleteWarehouse);


module.exports = router;
