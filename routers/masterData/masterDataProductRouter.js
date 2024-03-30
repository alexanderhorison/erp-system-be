const router = require("express").Router();
const MasterDataProductController = require("../../controllers/masterData/MasterDataProductController");

router.get("/all", MasterDataProductController.getAllProduct);
router.post("/create", MasterDataProductController.createProduct);

router.put("/:id", MasterDataProductController.updateProduct);
router.get("/:id", MasterDataProductController.getDetailProduct);
router.delete("/:id", MasterDataProductController.deleteProduct);


module.exports = router;
