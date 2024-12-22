const router = require("express").Router();
const MasterDataProductController = require('../../controllers/masterData/MasterDataProductController');


router.post("/create", MasterDataProductController.createProductTransformation);
router.get("/all", MasterDataProductController.getListTransformations);
router.get("/detail/:id", MasterDataProductController.getDetailProductTransformation);

router.get("/:productId", MasterDataProductController.getAllProductTransformation);
router.put("/:id", MasterDataProductController.updateProductTransformation);
router.delete("/:id", MasterDataProductController.deleteProductTransformation);

module.exports = router;
