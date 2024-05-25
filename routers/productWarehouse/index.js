const router = require("express").Router();
const routerTransformation = require("./routerTransformation")

const ProductWarehouseController = require("../../controllers/productWarehouse/ProductWarehouseController");


router.get("/", ProductWarehouseController.getAllWarehouse);
router.use("/transformation", routerTransformation)
router.get("/list", ProductWarehouseController.getListProduct)
router.get("/warehouse/:id", ProductWarehouseController.getProductByWarehouse);
router.post("/create/:WarehouseId", ProductWarehouseController.create);

router.get("/:id", ProductWarehouseController.getProductWarehouse);
router.put("/:id", ProductWarehouseController.adjustProduct);

module.exports = router;
