const router = require("express").Router();
const SalesOrderController = require("../../controllers/salesOrder/SalesOrderController");
const routerPayment = require("./paymentRouter")

router.get("/", SalesOrderController.getAllSalesOrder);
router.post("/create", SalesOrderController.createSalesOrder);

// FOR SALES ORDER PAYMENT
router.use("/payment", routerPayment)

// FOR APPROVE/REJECT SALES ORDER
router.post("/approve/:code", SalesOrderController.approveSalesOrder);
router.post("/reject/:code", SalesOrderController.rejectSalesOrder);

// FOR PRINT SO
router.post("/print/:code", SalesOrderController.printSalesOrder);

// GET SALES ORDER BY CUSTOMERID
router.get("/customer/:id", SalesOrderController.getSalesOrderByCustomerId);

router.get("/:code", SalesOrderController.getDetailSalesOrder);

// FOR UPDATE QUANTITY
router.put("/:code", SalesOrderController.updateSalesOrder)

module.exports = router;
