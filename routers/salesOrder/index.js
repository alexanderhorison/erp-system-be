const router = require("express").Router();
const SalesOrderController = require("../../controllers/salesOrder/SalesOrderController");

router.get("/", SalesOrderController.getAllSalesOrder);
router.post("/create", SalesOrderController.createSalesOrder);

// FOR APPROVE/REJECT SALES ORDER
router.post("/approve/:code", SalesOrderController.approveSalesOrder);
router.post("/reject/:code", SalesOrderController.rejectSalesOrder);

router.get("/:code", SalesOrderController.getDetailSalesOrder);

// FOR UPDATE QUANTITY
router.put("/:code", SalesOrderController.updateSalesOrder)

module.exports = router;
