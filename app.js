const express = require("express");
const app = express();
const userRouter = require("./routes/userRoutes");
const carRouter = require("./routes/carRoutes");
const errorHandler = require("./utilities/errorHandler");
app.use(express.json());
app.use("/api/user", userRouter);
app.use("/api/car", carRouter);

app.all("*", (req, res) => {
  // req.originalUrl
  if (!req.err)
    res
      .status(404)
      .json({ message: `can't find ${req.originalUrl} on this server` });
  else errorHandler(req.err, res);
});
module.exports = app;
