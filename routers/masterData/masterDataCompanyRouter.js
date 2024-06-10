const router = require("express").Router();
const MasterDataCompanyController = require('../../controllers/masterData/MasterDataCompanyController');

router.get("/all", MasterDataCompanyController.getAllCompany);
router.post("/create", MasterDataCompanyController.createCompany);

router.put("/:id", MasterDataCompanyController.updateCompany);
router.get("/:id", MasterDataCompanyController.getDetailCompany);
router.delete("/:id", MasterDataCompanyController.deleteCompany);


module.exports = router;
