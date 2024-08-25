const router = require("express").Router();
const InternalTransferController = require("../../controllers/internalTransfer/InternalTransferController");

router.get("/", InternalTransferController.getAllInternalTransfer);
router.post("/create", InternalTransferController.createInternalTransfer);

// FOR APPROVE/REJECT INTERNAL TRANSFER
router.post(
  "/approve/:code",
  InternalTransferController.approveInternalTransfer
);
router.post("/reject/:code", InternalTransferController.rejectInternalTransfer);

router.get("/:code", InternalTransferController.getDetailInternalTransfer);

module.exports = router;
