const router = require("express").Router();
const RoleController = require("../../controllers/role/RoleController");

router.get("/all", RoleController.getAllRole);
router.post("/create", RoleController.createRole);

router.get("/:roleId", RoleController.getRole);
router.put("/:roleId", RoleController.updateRole);
router.delete("/:roleId", RoleController.deleteRole);

module.exports = router;