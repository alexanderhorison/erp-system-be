const router = require("express").Router();
const MasterDataProductController = require("../../controllers/masterData/MasterDataProductController");
const routerMasterTransformation = require("../masterTransformation")
router.get("/all", MasterDataProductController.getAllProduct);
router.post("/create", MasterDataProductController.createProduct);

router.use("/transformation", routerMasterTransformation)

router.put("/:id", MasterDataProductController.updateProduct);
router.get("/:id", MasterDataProductController.getDetailProduct);
router.delete("/:id", MasterDataProductController.deleteProduct);


module.exports = router;
