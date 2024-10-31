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
const routerSalesOrder = require("./salesOrder");
const routerPurchaseOrder = require("./purchaseOrder");
const EmailController = require('../controllers/email/EmailController');
const multer = require('multer');
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

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

// Sales Order
router.use("/sales-order", routerSalesOrder);

// Purchase Order
router.use("/purchase-order", routerPurchaseOrder);

router.post("/send-email", upload.single('pdf'), EmailController.sendEmail)

module.exports = router;
