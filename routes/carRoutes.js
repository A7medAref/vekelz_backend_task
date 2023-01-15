const express = require("express");
const { uploadUsersPhotos } = require("../controller/imageHandler.controller");
const {
  createCars,
  getCars,
  deleteCars,
  updateCars,
  getCar,
  deleteCar,
  updateCar,
} = require("../controller/car.controller");
const router = express.Router();

router
  .route("/")
  .post(uploadUsersPhotos, createCars)
  .get(getCars)
  .delete(deleteCars)
  .put(uploadUsersPhotos, updateCars);

router
  .route("/:id")
  .get(getCar)
  .delete(deleteCar)
  .put(uploadUsersPhotos, updateCar);

module.exports = router;
