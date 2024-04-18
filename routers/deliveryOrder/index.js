const router = require("express").Router();
const DeliveryOrderController = require("../../controllers/deliveryOrder/DeliveryOrderController");
const Auth = require("../../helpers/auth");

router.use(Auth.AuthenticationRoleSuratJalan);
router.get("/all", DeliveryOrderController.getAllDeliveryOrder);
router.post("/create", DeliveryOrderController.createDeliveryOrder);

router.get("/:userId", DeliveryOrderController.getDetailDeliveryOrder);

module.exports = router;
