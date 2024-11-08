const router = require("express").Router();
const TermsOfPaymentController = require("../../controllers/purchaseOrder/TermsOfPaymentController");

router.post("/create", TermsOfPaymentController.createTermsOfPayment);
router.get("/detail/:id", TermsOfPaymentController.getDetailTermsOfPayment);
router.get("/:purchaseOrderCode", TermsOfPaymentController.getAllTermsOfPayment);
router.put("/:id", TermsOfPaymentController.updateTermsOfPayment);
router.delete("/:id", TermsOfPaymentController.deleteTermsOfPayment);

module.exports = router;
