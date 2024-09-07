const DeliveryOrderReceiveOutstandingController = require("../../controllers/deliveryOrderReceiveOutstanding/DeliveryOrderReceiveOutstandingController");

const router = require("express").Router();

router.get("/all", DeliveryOrderReceiveOutstandingController.getAllDeliveryOrderReceiveOutstanding)
router.put("/draft", DeliveryOrderReceiveOutstandingController.saveToDraftDeliveryOrderReceiveOutstanding)
router.post("/approve/:code", DeliveryOrderReceiveOutstandingController.approveDeliveryOrderReceiveOutstanding)
router.get("/:code", DeliveryOrderReceiveOutstandingController.getDeliveryOrderReceiveOutstandingByCode)

module.exports = router;