const MasterDataCustomerController = require("../../controllers/masterData/MasterDataCustomerController");
const router = require("express").Router();

router.get("/all", MasterDataCustomerController.getAllCustomer);
router.post("/create", MasterDataCustomerController.createCustomer);
router.post("/create-pos", MasterDataCustomerController.createCustomerAtPos);

router.put("/:id", MasterDataCustomerController.updateCustomer);
router.get("/:id", MasterDataCustomerController.getDetailCustomer);
router.delete("/:id", MasterDataCustomerController.deleteCustomer);

module.exports = router;
