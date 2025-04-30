const router = require("express").Router();
const MasterDataUnexpectedCostCategoryController = require("../../controllers/masterData/MasterDataUnexpectedCostCategoryController");

router.get("/all", MasterDataUnexpectedCostCategoryController.getAllCategories);
router.post("/create", MasterDataUnexpectedCostCategoryController.createCategory);

router.put("/:id", MasterDataUnexpectedCostCategoryController.updateCategory);
router.get("/:id", MasterDataUnexpectedCostCategoryController.getDetailCategory);
router.delete("/:id", MasterDataUnexpectedCostCategoryController.deleteCategory);

module.exports = router;