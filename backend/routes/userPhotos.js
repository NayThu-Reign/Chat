const express = require("express");
const router = express.Router();
const userPhotoController = require("../controllers/userPhotoController");
const auth = require("../middleware/auth");

router.put("/users/update/:id", auth, userPhotoController.updateUser);
router.get("/getUserPhotos", auth, userPhotoController.getUserPhotos);


module.exports = router;