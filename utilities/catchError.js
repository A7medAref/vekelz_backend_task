function catchError(fn) {
  return (req, res, next) =>
    fn(req, res, next).catch((err) => {
      req.err = err;
      next();
    });
}
module.exports = catchError;
