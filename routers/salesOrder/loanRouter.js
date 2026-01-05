const router = require("express").Router();
const SalesOrderController = require("../../controllers/salesOrder/SalesOrderController");

router.get("/", SalesOrderController.getAllLoanProduct);
router.post("/create", SalesOrderController.payLoanProducts);

module.exports = router;