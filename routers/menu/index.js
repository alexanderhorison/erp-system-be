const router = require("express").Router();
const MenuController = require("../../controllers/menu/MenuController");

router.get("/all", MenuController.getAllMenu);
router.post("/create", MenuController.createMenu);

router.get("/:menuId", MenuController.getMenu);
router.put("/:menuId", MenuController.updateMenu);
router.delete("/:menuId", MenuController.deleteMenu);



module.exports = router;