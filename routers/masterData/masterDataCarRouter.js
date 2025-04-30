const router = require("express").Router();
const MasterDataCarController = require("../../controllers/masterData/MasterDataCarController");

router.get("/all", MasterDataCarController.getAllCars);
router.post("/create", MasterDataCarController.createCar);

router.put("/:id", MasterDataCarController.updateCar);
router.get("/:id", MasterDataCarController.getDetailCar);
router.delete("/:id", MasterDataCarController.deleteCar);

module.exports = router;