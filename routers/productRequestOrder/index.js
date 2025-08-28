const router = require("express").Router();
const ProductRequestOrderController = require("../../controllers/productRequestOrder/ProductRequestOrderController");

router.get("/all", ProductRequestOrderController.getAllProductRequest);
// CREATE PRODUCT REQUEST ORDER
router.post("/create", ProductRequestOrderController.createProductRequest);

router.post("/process-request", ProductRequestOrderController.processProductRequestOrder);

router.get("/process-request/:code", ProductRequestOrderController.getProcessProductRequestOrder)

// REJECT PRODUCT REQUEST ORDER
router.post("/reject/:code", ProductRequestOrderController.rejectProductRequestOrder);

router.get("/:code", ProductRequestOrderController.getDetailProductRequestOrder);

// // FOR UPDATE PRODUCT REQUEST ORDER
router.put("/:code", ProductRequestOrderController.updateProductRequestOrder)

module.exports = router;