const connection = require("../connection");
const APIFeatures = require("../utilities/apiFeatures");
const { promisify } = require("util");
const { unlink } = require("fs/promises");
const appError = require("../utilities/appError");
const catchError = require("../utilities/catchError");
const {
  savePhotosToServer,
  savePhotoToServer,
} = require("./imageHandler.controller");
const query = promisify(connection.query).bind(connection);

/** add image attribute to the object to be stored in the DB.
 *
 * @param {files} req images should be prepared.
 * @param users data of created users.
 */
const preparePhotosBodies = (req, users) => {
  if (req.files.length !== users.length)
    throw new appError("images must be uploaded for all users", 400);

  const host = `${req.protocol}://${req.get("host")}`;
  users.map((e) => {
    e.image = `${host}/media/user-${e.id}.jpeg`;
  });
};

/** Create multiple users in the same request.
 *
 */
exports.createUsers = catchError(async (req, res) => {
  const users = req.body.users;
  if (!users.length)
    throw new appError("at least one user must be provided", 400);
  preparePhotosBodies(req, users);
  const values = users.map((e) => [
    e.id,
    e.firstName,
    e.lastName,
    e.email,
    e.phone,
    e.image,
  ]);
  await query(`INSERT INTO user values ?`, [values]);
  await savePhotosToServer(req.files, users, "user");
  res.json({ status: "success" });
});

/** These function returns all users in the database with pagination
 *
 */
exports.getUsers = catchError(async (req, res) => {
  const users = await query(
    new APIFeatures("user", req.query).paginate().query
  );
  res.json(users);
});

/** This function update all users in the array provided in the body
 *
 */
exports.updateUsers = catchError(async (req, res) => {
  const users = req.body.users;
  const queries = [];
  preparePhotosBodies(req, users);
  users.forEach((e) => {
    queries.push(query(`UPDATE user SET ? WHERE id="${e.id}"`, e));
  });
  await Promise.all(queries);
  savePhotosToServer(req.files, users, "user");
  res.json({ status: "success" });
});

/** Delete multiple users with ids provided in the request body.
 *
 */
exports.deleteUsers = catchError(async (req, res) => {
  let deleteQuery = "DELETE from user where (id) IN (?)";
  const ids = req.body.map((e) => [e.id]);
  await query(deleteQuery, ids);
  const deletedPromises = req.body.map((e) =>
    unlink(`./media/user-${e.id}.jpeg`)
  );
  await Promise.all(deletedPromises);
  res.json({ status: "success" });
});

/** Get user by the id
 *
 */
exports.getUser = catchError(async (req, res) => {
  const user = await query(`SELECT * from user where id = '${req.params.id}'`);
  if (!user.length) throw new appError("No user with such id", 400);
  res.json(user[0]);
});

/** update user who his id is provided.
 *
 */
exports.updateUser = catchError(async (req, res) => {
  if (!req.file) throw new appError("user new photo must be provided");
  await query(`UPDATE user SET ? WHERE id= '${req.params.id}'`, req.body);
  await savePhotoToServer(req.file, req.params.id, "user");
  res.json({ status: "success" });
});

/** Delete user by id.
 *
 */
exports.deleteUser = catchError(async (req, res) => {
  await query(`DELETE from user where id=${req.params.id}`);
  await unlink(`./media/user-${req.params.id}.jpeg`);
  res.json({ status: "success" });
});
