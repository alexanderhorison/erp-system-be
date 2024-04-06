const router = require("express").Router();
const UserController = require("../../controllers/user/UserController");

router.get("/all", UserController.getAllUser);
router.post("/create", UserController.createUser);
router.post("/login", UserController.login);
router.post("/auth/me", UserController.authMe);

router.get("/:userId", UserController.getUser);
router.put("/:userId", UserController.updateUser);
router.delete("/:userId", UserController.deleteUser);

module.exports = router;
