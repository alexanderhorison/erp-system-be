const router = require("express").Router();
const DeliveryOrderReceiveController = require("../../controllers/deliveryOrderReceive/DeliveryOrderReceiveController");
// const DeliveryOrderController = require("../../controllers/deliveryOrder/DeliveryOrderController");
const Auth = require("../../helpers/auth");
const outStandingROuter = require("./outstandingRouter");
router.use(Auth.AuthenticationRoleSuratJalanReceive);

router.use("/outstanding", outStandingROuter)
router.get("/all", DeliveryOrderReceiveController.getAllDeliveryOrderReceive);
router.post("/create", DeliveryOrderReceiveController.createDeliveryOrderReceive);

router.get("/:id", DeliveryOrderReceiveController.getDetailDeliveryOrderReceive);

// Update or terima Surat Jalan
router.put("/:deliveryOrderId", DeliveryOrderReceiveController.updateDeliveryOrder);

module.exports = router;
