const router = require("express").Router();
const PointOfSaleController = require("../../controllers/pointOfSale/PointOfSaleController");

router.get(
  "/find-product-by-warehouseid",
  PointOfSaleController.getProductByWarehouseId
);
router.get(
  "/get-all-product-by-productid",
  PointOfSaleController.getAllProductByProductId
);
router.get(
  "/get-all-point-of-sale/:warehouseId",
  PointOfSaleController.getAllPointOfSaleByWarehouseId
);
router.post("/add-favorite", PointOfSaleController.addOrRemoveFavorite);
router.post("/create-point-of-sale", PointOfSaleController.createPointOfSale);
router.get("/payment-type", PointOfSaleController.getPaymentType);

router.post("/print-v3/:code", PointOfSaleController.printPos);

router.get("/:code", PointOfSaleController.getDetailPointOfSale);

module.exports = router;
