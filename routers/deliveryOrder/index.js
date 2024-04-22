const router = require("express").Router();
const DeliveryOrderController = require("../../controllers/deliveryOrder/DeliveryOrderController");
const Auth = require("../../helpers/auth");

router.use(Auth.AuthenticationRoleSuratJalan);
router.get("/all", DeliveryOrderController.getAllDeliveryOrder);
router.post("/create", DeliveryOrderController.createDeliveryOrder);

// FOR ADD PRODUCT AT INVOICE
router.post("/list-product", DeliveryOrderController.getInvoiceListProduct);

router.get("/:id", DeliveryOrderController.getDetailDeliveryOrder);

module.exports = router;
