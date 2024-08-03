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

// Product Warehouse
router.use("/product-warehouse", routerProductWarehouse);

// Delivery Order
router.use("/delivery-order", routerDeliveryOrder);

// Delivery Order Receive
router.use("/delivery-order-receive", routerDeliveryOrderReceive);

// Stock Opname
router.use("/stock-opname", routerStockOpname);

module.exports = router;
