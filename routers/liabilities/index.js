const router = require("express").Router();
const routerShortTerm = require("./shortTermRouter");
const routerLongTerm = require("./longTermRouter");

router.use("/short-term", routerShortTerm);
router.use("/long-term", routerLongTerm);

module.exports = router;