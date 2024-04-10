const router = require("express").Router();
const routerMasterData = require("./masterData");
const routerMenu = require("./menu");
const routerUser = require("./user");
const routerRole = require("./role");
const routerProductWarehouse = require("./productWarehouse")

router.get("/", (req, res) => {
    res.status(200).json({ page: "Home", project: "Inventory System" });
});
router.use("/master", routerMasterData);

// Menu
router.use("/menu", routerMenu);

// User
router.use("/user", routerUser);

// Role
router.use("/role", routerRole);

// Product Warehouse
router.use("/product-warehouse", routerProductWarehouse)

module.exports = router;
