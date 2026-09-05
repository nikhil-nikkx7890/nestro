import multer from "multer";

/**
 * Multer reports its own failures as MulterError, which carries a string
 * `code` and no statusCode — so before ADR-058 every one of them fell
 * through to the generic branch below and surfaced as a 500 "Something
 * went wrong.", including something as ordinary as picking too large a
 * file. These are all caller mistakes, so they map to 400 with a message
 * that says what to do differently.
 *
 * Only the size limit this app actually sets is spelled out; the rest get
 * a correct status and a generic-but-honest message rather than being
 * enumerated speculatively.
 */
const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: "That image is too large. The maximum size is 5MB.",
  LIMIT_FILE_COUNT: "Too many files were uploaded at once.",
  LIMIT_UNEXPECTED_FILE: "Unexpected file field. Upload the image as `image`.",
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: MULTER_MESSAGES[err.code] || "That file could not be uploaded.",
    });
  }

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
