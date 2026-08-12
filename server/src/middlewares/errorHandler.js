export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists.",
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Something went wrong.";

  res.status(statusCode).json({
    success: false,
    message,
  });
};
