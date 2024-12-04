const router = require("express").Router();
const PointOfSaleController = require("../../controllers/pointOfSale/PointOfSaleController");

router.post("/add-favorite", PointOfSaleController.addOrRemoveFavorite);

module.exports = router;
