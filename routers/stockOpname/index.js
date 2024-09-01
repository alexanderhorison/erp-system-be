const router = require("express").Router();

const StockOpnameController = require("../../controllers/stockOpname/StockOpnameController");

router.get("/", StockOpnameController.getAllStockOpname);
router.post("/create", StockOpnameController.createStockOpname);
router.get("/detail/:code", StockOpnameController.getDetailStockOpnameByCode);
router.put("/approve/:code", StockOpnameController.approveStockOpnameByCode);
router.put("/reject/:code", StockOpnameController.rejectStockOpnameByCode);
router.post("/confirm/:code", StockOpnameController.confirmStockOpnameByCode);
router.put("/:code", StockOpnameController.updateDetailStockOpnameByCode);
router.delete("/:code", StockOpnameController.deleteStockOpnameByCode);

module.exports = router