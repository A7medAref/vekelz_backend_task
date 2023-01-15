const express = require("express");
const userController = require("../controller/user.controller");
const {
  uploadUsersPhotos,
  uploadUserPhoto,
} = require("../controller/imageHandler.controller");
const router = express.Router();

router
  .route("/")
  .get(userController.getUsers)
  .put(uploadUsersPhotos, userController.updateUsers)
  .post(uploadUsersPhotos, userController.createUsers)
  .delete(userController.deleteUsers);

router
  .route("/:id")
  .get(userController.getUser)
  .put(uploadUserPhoto, userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
