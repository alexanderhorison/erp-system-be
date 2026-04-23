const router = require("express").Router();
const UserShiftController = require("../../controllers/userShift/UserShiftController");

router.get("/available", UserShiftController.getAvailableShifts);
router.post("/start", UserShiftController.startShift);
router.get("/current", UserShiftController.getCurrentShift);
router.get("/summary", UserShiftController.getShiftSummary);
router.put("/end", UserShiftController.endShift);
router.get("/history", UserShiftController.getShiftHistory);

module.exports = router;
