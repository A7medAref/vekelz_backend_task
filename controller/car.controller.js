const connection = require("../connection");
const APIFeatures = require("../utilities/apiFeatures");
const appError = require("../utilities/appError");
const { promisify } = require("util");
const { unlink } = require("fs/promises");
const catchError = require("../utilities/catchError");
const fs = require("fs/promises");
const { saveCarPhotosToServer } = require("./imageHandler.controller");
const query = promisify(connection.query).bind(connection);
const carSelectFields =
  "carImages.id as imageId, carMake, carModel, color, car.id, user.id as userId," +
  " firstName, lastName, email, phone, user.image as userImage, carImages.image";

/** format files to be saved in the file system
 *
 * @param files files returned from multer
 * @returns formated files as a map
 */
const formatFiles = (files) => {
  const myImages = new Map();
  let prevIndex = -1;
  let index;
  files.forEach((e) => {
    index = e.fieldname.slice(
      e.fieldname.indexOf("[") + 1,
      e.fieldname.indexOf("]")
    );
    if (prevIndex == index) myImages.get(index).push(e);
    else myImages.set(index, [e]);
    prevIndex = index;
  });
  return myImages;
};

/** helper function to select images related to that car.
 *
 * @param {*} filesNames files names in media to be filtered.
 * @param {*} id the id of the car we want to delete it's images
 * @param {*} promisesArray array contains the promises
 */
const deleteFilesBelongsToCar = (filesNames, id, promisesArray) => {
  filesNames
    .filter((file) => file.startsWith(`car-${id}`))
    .forEach((filteredFile) =>
      promisesArray.push(unlink(`./media/${filteredFile}`))
    );
};

/** Create multiple cars in the same request.
 *
 */
exports.createCars = catchError(async (req, res) => {
  const cars = req.body.cars;
  const formatedFiles = formatFiles(req.files);
  let carValues = [];
  let imageValues = [];
  cars.forEach((car) => {
    carValues.push([car.id, car.carMake, car.carModel, car.color, car.userId]);
    car.images.forEach(({ id }) => {
      imageValues.push([
        id,
        car.id,
        `${req.protocol}://${req.get("host")}/media/car-${car.id}-${id}`,
      ]);
    });
  });

  await Promise.all([
    query(`INSERT INTO car values ?`, [carValues]),
    query(`insert INTO carImages values ?`, [imageValues]),
  ]);
  await saveCarPhotosToServer(formatedFiles, cars);

  res.json({ status: "success" });
});

/** Formate the output of the get function
 *
 * @param cars the return of the query
 * @returns formated response
 */
const prepareCarsFormated = (cars) => {
  let carsFormated = [];
  let prevId = -1;
  cars.forEach((car) => {
    if (prevId === car.id)
      carsFormated[carsFormated.length - 1].images.push({
        id: car.imageId,
        image: car.image,
      });
    else
      carsFormated.push({
        id: car.id,
        carMake: car.carMake,
        carModel: car.carModel,
        color: car.color,
        images: [{ id: car.imageId, image: car.image }],
        user: {
          id: car.userId,
          firstName: car.firstName,
          lastName: car.firstName,
          email: car.email,
          image: car.userImage,
          phone: car.phone,
        },
      });
    prevId = car.id;
  });
  return carsFormated;
};

/** This function returns all cars in the database with pagination
 *
 */
exports.getCars = catchError(async (req, res) => {
  const cars = await query(
    new APIFeatures("car", req.query, carSelectFields)
      .join("carImages", "id", "carId")
      .join("user", "userId", "id")
      .paginate().query
  );
  res.json(prepareCarsFormated(cars));
});

/** Delete multiple cars with ids provided in the request body.
 *
 */
exports.deleteCars = catchError(async (req, res) => {
  const ids = req.body.map((e) => e.id);
  await Promise.all([
    query("DELETE from car where (id) IN (?)", [ids]),
    query("DELETE from carImages where (carId) IN (?)", [ids]),
  ]);
  const files = await fs.readdir("./media");
  const deletedPromises = [];
  ids.forEach((id) => deleteFilesBelongsToCar(files, id, deletedPromises));
  await Promise.all(deletedPromises);
  res.json({ status: "success" });
});

/** This function update all cars in the array provided in the body
 *
 */
exports.updateCars = catchError(async (req, res) => {
  const cars = req.body.cars;
  const ids = cars.map((e) => e.id);
  let carQueries = [];
  let imageQueries = [];
  // Delete photos in the carImages table to reduce the complixty of the operation
  query("DELETE from carImages where (carId) IN (?)", [ids]);

  cars.forEach((car) => {
    carQueries.push(
      query(`UPDATE car SET ? WHERE id="${car.id}"`, {
        id: car.id,
        carMake: car.carMake,
        carModel: car.carModel,
        color: car.color,
        userId: car.userId,
      })
    );
    car.images.forEach(({ id }) => {
      imageQueries.push([
        id,
        car.id,
        `${req.protocol}://${req.get("host")}/media/car-${car.id}-${id}`,
      ]);
    });
  });

  await Promise.all([
    ...carQueries,
    query(`insert INTO carImages values ?`, [imageQueries]),
  ]);
  const files = await fs.readdir("./media");
  const deletedPromises = [];
  ids.forEach((id) => deleteFilesBelongsToCar(files, id, deletedPromises));
  await Promise.all([
    ...deletedPromises,
    saveCarPhotosToServer(formatFiles(req.files), cars),
  ]);

  res.json({ status: "success" });
});

/** Get car by id
 *
 */
exports.getCar = catchError(async (req, res) => {
  const car = await query(
    new APIFeatures("car", req.query, carSelectFields)
      .join("carImages", "id", "carId")
      .join("user", "userId", "id")
      .filter({
        "car.id": req.params.id,
      }).query
  );
  if (!car.length) throw new appError("No car with such id", 400);
  res.json(prepareCarsFormated(car)[0]);
});

/** Delete car by id
 *
 */
exports.deleteCar = catchError(async (req, res) => {
  const id = req.params.id;
  await Promise.all([
    query(`DELETE from car where id = ${id}`),
    query(`DELETE from carImages where carId = ${id}`),
  ]);
  const filesNames = await fs.readdir("./media");
  const deletedPromises = [];
  deleteFilesBelongsToCar(filesNames, id, deletedPromises);
  await Promise.all(deletedPromises);
  res.json({ status: "success" });
});

/** Update car by id
 *
 */
exports.updateCar = catchError(async (req, res) => {
  const car = req.body;
  const id = req.params.id;
  let carQueries = [];
  let imageQueries = [];
  query(`DELETE from carImages where carId = ${id}`);
  car.images.forEach(({ id }) => {
    imageQueries.push([
      id,
      car.id,
      `${req.protocol}://${req.get("host")}/media/car-${car.id}-${id}`,
    ]);
  });
  await Promise.all([
    carQueries.push(
      query(`UPDATE car SET ? WHERE id="${car.id}"`, {
        id: car.id,
        carMake: car.carMake,
        carModel: car.carModel,
        color: car.color,
        userId: car.userId,
      })
    ),
    query(`insert INTO carImages values ?`, [imageQueries]),
  ]);
  const files = new Map();
  files.set("0", req.files);
  await saveCarPhotosToServer(files, [car]);
  res.json({ status: "success" });
});
