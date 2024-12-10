const router = require("express").Router();
const PointOfSaleController = require("../../controllers/pointOfSale/PointOfSaleController");

router.get("/find-product-by-warehouseid", PointOfSaleController.getProductByWarehouseId);
router.get("/get-all-product-by-productid", PointOfSaleController.getAllProductByProductId);
router.post("/add-favorite", PointOfSaleController.addOrRemoveFavorite);

module.exports = router;
