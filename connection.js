const mysql = require("mysql");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

const connection = mysql.createConnection({
  host: process.env.database_host,
  user: process.env.database_user,
  database: process.env.database_name,
  password: process.env.database_password,
  port: process.env.database_port,
});

connection.connect(function (err) {
  if (err) {
    throw err;
  }
  console.log("Connected!");
});

module.exports = connection;
