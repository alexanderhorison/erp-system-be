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

router.post(
  "/validate-price",
  PointOfSaleController.validatePrice
)

// FOR SCHEDULER REPORT POIN OF SALE 24 HOUR
router.post("/report-pos-last-day", PointOfSaleController.runSchedulerReportPos)

router.get(
  "/get-all-point-of-sale/:warehouseId",
  PointOfSaleController.getAllPointOfSaleByWarehouseId
);
router.get(
  "/get-all-point-of-sale-by-customer/:customerId",
  PointOfSaleController.getAllPointOfSaleByCustomerId
);
router.post("/add-favorite", PointOfSaleController.addOrRemoveFavorite);
router.post("/create-point-of-sale", PointOfSaleController.createPointOfSale);
router.get("/payment-type", PointOfSaleController.getPaymentType);

router.post("/print-v3/:code", PointOfSaleController.printPos);

router.post("/void/:code", PointOfSaleController.voidPointOfSale);

router.get("/:code", PointOfSaleController.getDetailPointOfSale);

module.exports = router;
