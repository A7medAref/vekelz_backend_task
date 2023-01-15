const multer = require("multer");
const sharp = require("sharp");

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new appError("not an image! please provide an image"));
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUsersPhotos = upload.any();
exports.uploadUserPhoto = upload.single("image");

exports.savePhotosToServer = async (files, objects, tableName) => {
  files.forEach((e, i) => {
    sharp(e.buffer)
      .toFormat("jpeg")
      .toFile(`./media/${tableName}-${objects[i].id}.jpeg`);
  });
};

exports.saveCarPhotosToServer = async (files, cars) => {
  cars.forEach((car, carIndex) => {
    car.images.forEach(({ id }, imageIndex) => {
      sharp(files.get(`${carIndex}`)[imageIndex].buffer)
        .toFormat("jpeg")
        .toFile(`./media/car-${car.id}-${id}.jpeg`);
    });
  });
};

exports.savePhotoToServer = async (file, id, tableName) => {
  sharp(file.buffer).toFormat("jpeg").toFile(`./media/${tableName}-${id}.jpeg`);
};
