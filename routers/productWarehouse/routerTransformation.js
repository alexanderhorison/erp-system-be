const router = require("express").Router();

const ProductWarehouseTransformation = require("../../controllers/productWarehouse/ProductWarehouseTransformation");


router.get("/:id", ProductWarehouseTransformation.getList)
router.post("/:id", ProductWarehouseTransformation.transformProduct)

module.exports = router;