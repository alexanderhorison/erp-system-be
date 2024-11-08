const router = require("express").Router();
const PurchaseOrderController = require('../../controllers/purchaseOrder/PurchaseOrderController');
const routerPayment = require("./paymentRouter")
const routerTermsOfPayment = require("./termsOfPaymentRouter")

router.get("/", PurchaseOrderController.getAllPurchaseOrder);
router.post("/create", PurchaseOrderController.createPurchaseOrder);

// FOR PURCHASE ORDER PAYMENT
router.use("/payment", routerPayment)

// TERMS OF PAYMENT
router.use("/terms-of-payment", routerTermsOfPayment)

// FOR APPROVE/REJECT PURCHASE ORDER
router.post("/approve/:code", PurchaseOrderController.approvePurchaseOrder);
router.post("/reject/:code", PurchaseOrderController.rejectPurchaseOrder);

// GET PURCHASE ORDER BY VENDOR
router.get("/vendor/:id", PurchaseOrderController.getPurchaseOrderByVendorId);

router.get("/:code", PurchaseOrderController.getDetailPurchaseOrder);

// FOR UPDATE QUANTITY
router.put("/:code", PurchaseOrderController.updatePurchaseOrder)

module.exports = router;
