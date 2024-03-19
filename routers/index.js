const router = require("express").Router();

router.get("/", (req, res) => {
  res.status(200).json({ page: "Home", project: "Inventory System" });
});

module.exports = router;