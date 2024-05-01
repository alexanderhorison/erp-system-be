const router = require("express").Router();
const ProductWarehouseController = require("../../controllers/productWarehouse/ProductWarehouseController");

router.get("/", ProductWarehouseController.getAllWarehouse);
router.get("/list", ProductWarehouseController.getListProduct)
router.get("/warehouse/:id", ProductWarehouseController.getProductByWarehouse);
router.post("/create/:WarehouseId", ProductWarehouseController.create);


router.get("/:id", ProductWarehouseController.getProductWarehouse);
router.put("/:id", ProductWarehouseController.adjustProduct);

module.exports = router;
