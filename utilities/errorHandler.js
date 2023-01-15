module.exports = (err, res) => {
  res.status(err.statusCode || 400).json({
    status: "error",
    message: err.sqlMessage || err.message,
  });
};
