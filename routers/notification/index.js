const router = require("express").Router();
const NotificationController = require("../../controllers/notification/NotificationController");

// GET /notification — returns pending counts keyed by menuId
router.get("/", NotificationController.getPendingCount);

module.exports = router;
