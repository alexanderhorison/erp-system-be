const router = require("express").Router();
const MasterDataCategoryController = require("../../controllers/master_data/MasterDataCategoryController");

router.get("/all", MasterDataCategoryController.getAllCategory);
router.post("/create", MasterDataCategoryController.createCategory);

router.put("/:categoryId", MasterDataCategoryController.updateCategory);
router.get("/:categoryId", MasterDataCategoryController.getDetailCategory);
router.delete("/:categoryId", MasterDataCategoryController.deleteCategory);

module.exports = router;
