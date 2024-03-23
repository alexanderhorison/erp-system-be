const router = require("express").Router();
const MasterDataProductController = require("../../controllers/master_data/MasterDataProductController");

router.get("/all", MasterDataProductController.getAllProduct);
router.post("/create", MasterDataProductController.createProduct);

router.put("/:productId", MasterDataProductController.updateProduct);
router.get("/:productId", MasterDataProductController.getDetailProduct);
router.delete("/:productId", MasterDataProductController.deleteProduct);


module.exports = router;
