const connection = require("./connection");

const { promisify } = require("util");
const query = promisify(connection.query).bind(connection);
const app = require("./app");

const port = process.env.PORT || 3500;

app.listen(port, async () => {
  await query("Delete from user");
  await query("Delete from car");
  await query("Delete from carImages");
});
