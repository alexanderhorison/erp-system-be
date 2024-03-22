const router = require("express").Router();
const routerMasterData = require("./masterData");

router.get("/", (req, res) => {
    res.status(200).json({ page: "Home", project: "Inventory System" });
});
router.use("/master", routerMasterData);

module.exports = router;
