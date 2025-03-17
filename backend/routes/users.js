const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", auth, userController.logout);
router.post("/unactive", auth, userController.unActive);
router.post("/active", auth, userController.active);
router.post("/refresh-token", userController.refreshToken);
router.get("/verify-email", userController.verifyEmail);
router.get("/users", auth, userController.getAllUsers);
router.get("/users/get-detail", auth, userController.getUserDetail);
router.get("/users/:id", auth, userController.getRecipientDetail);
// router.put("/users/update/:id", auth, userController.updateUser);
router.post("/users/:id/add-to-group", auth, userController.addToGroup);
router.post('/send-reset-email', userController.sendPasswordResetEmail);
router.post('/reset-password', userController.resetPassword);

module.exports = router;