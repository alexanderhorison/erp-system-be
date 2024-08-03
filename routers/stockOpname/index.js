const router = require("express").Router();

const StockOpnameController = require("../../controllers/stockOpname/StockOpnameController");

router.get("/", StockOpnameController.getAllStockOpname);
router.post("/create", StockOpnameController.createStockOpname);
router.get("/detail/:id", StockOpnameController.getDetailStockOpnameById);
router.put("/approve/:id", StockOpnameController.approveStockOpnameById);
router.put("/reject/:id", StockOpnameController.rejectStockOpnameById);
router.put("/:id", StockOpnameController.updateDetailStockOpnameById);
router.delete("/:id", StockOpnameController.deleteStockOpnameById);

module.exports = router