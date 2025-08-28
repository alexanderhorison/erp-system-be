const router = require("express").Router();
const routerTransformation = require("./routerTransformation")

const ProductWarehouseController = require("../../controllers/productWarehouse/ProductWarehouseController");


router.get("/", ProductWarehouseController.getAllWarehouse);
router.get("/find", ProductWarehouseController.findProductByFilters);
router.use("/transformation", routerTransformation)
router.get("/list", ProductWarehouseController.getListProduct)
router.get("/deleted", ProductWarehouseController.getDeletedProduct)
router.post("/restore/:id", ProductWarehouseController.restoreProduct)
router.get("/warehouse/:id", ProductWarehouseController.getProductByWarehouse);
router.post("/create/:warehouseId", ProductWarehouseController.create);

// for get product internal transfer
router.get("/warehouse/:id/list-product-internal-transfer", ProductWarehouseController.getProductWarehouseInternalTransfer)

router.get("/history/:id", ProductWarehouseController.getHistoryProductWarehouse);
router.get("/:id", ProductWarehouseController.getProductWarehouse);
router.put("/:id", ProductWarehouseController.adjustProduct);
router.delete("/:id", ProductWarehouseController.deleteProductWarehouse);

module.exports = router;
