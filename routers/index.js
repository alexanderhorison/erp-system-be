const router = require("express").Router();
const routerMasterData = require("./masterData");
const routerMenu = require("./menu");
const routerUser = require("./user");
const routerRole = require("./role");
const routerProductWarehouse = require("./productWarehouse");
const Auth = require("../helpers/auth");
const routerDeliveryOrder = require("./deliveryOrder");
const routerDeliveryOrderReceive = require("./deliveryOrderReceive");
const routerStockOpname = require("./stockOpname");
const routerAdjustmentGoods = require("./adjustmentGoods");
const routerInternalTransfer = require("./internalTransfer");
const MigrationController = require("../controllers/migration/MigrationController");
const routerDashboard = require("./dashboard");

router.get("/", (req, res) => {
  res.status(200).json({ page: "Home", project: "Inventory System" });
});

// User
router.use("/user", routerUser);

// User Middleware to get data Auth
router.use(Auth.Authentication);

router.use("/master", routerMasterData);

// Menu
router.use("/menu", routerMenu);

// Role
router.use("/role", routerRole);

// Dashboard
router.use("/dashboard", routerDashboard);

// Product Warehouse
router.use("/product-warehouse", routerProductWarehouse);

// Delivery Order
router.use("/delivery-order", routerDeliveryOrder);

// Delivery Order Receive
router.use("/delivery-order-receive", routerDeliveryOrderReceive);

// Stock Opname
router.use("/stock-opname", routerStockOpname);

// Adjustment Goods
router.use("/adjustment-goods", routerAdjustmentGoods);

// API Migrations
router.post("/api-migrations", MigrationController.apiMigration);

// Internal Transfer
router.use("/internal-transfer", routerInternalTransfer);

module.exports = router;
