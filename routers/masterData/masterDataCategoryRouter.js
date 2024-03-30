const router = require("express").Router();
const MasterDataCategoryController = require("../../controllers/masterData/MasterDataCategoryController");

router.get("/all", MasterDataCategoryController.getAllCategory);
router.post("/create", MasterDataCategoryController.createCategory);

router.put("/:id", MasterDataCategoryController.updateCategory);
router.get("/:id", MasterDataCategoryController.getDetailCategory);
router.delete("/:id", MasterDataCategoryController.deleteCategory);

module.exports = router;
