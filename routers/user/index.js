const router = require("express").Router();
const UserController = require("../../controllers/user/UserController");

router.get("/all", UserController.getAllUser);
router.post("/create", UserController.createUser);

router.get("/:userId", UserController.getUser);
router.put("/:userId", UserController.updateUser);
router.delete("/:userId", UserController.deleteUser);

module.exports = router;
