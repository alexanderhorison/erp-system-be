const router = require("express").Router();
const SalesOrderPaymentController = require("../../controllers/salesOrder/SalesOrderPaymentController");

router.post("/create", SalesOrderPaymentController.createSalesOrderPayment);
router.get(
  "/:salesOrderId",
  SalesOrderPaymentController.getAllSalesOrderPayment
);

module.exports = router;
