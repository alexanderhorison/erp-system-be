const router = require("express").Router();
const PurchaseOrderPaymentController = require("../../controllers/purchaseOrder/PurchaseOrderPaymentController");

router.post("/create", PurchaseOrderPaymentController.createPurchaseOrderPayment);
router.get(
  "/:purchaseOrderId",
  PurchaseOrderPaymentController.getAllPurchaseOrderPayment
);

module.exports = router;