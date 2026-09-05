import multer from "multer";
import AppError from "../utils/AppError.js";

/**
 * We use memoryStorage instead of diskStorage because we don't want to
 * save the file to our own server's disk at all — we only need it in
 * memory (as a Buffer) long enough to forward it to Cloudinary.
 * req.file.buffer is where that raw file data will live.
 */
const storage = multer.memoryStorage();

/**
 * An explicit allowlist rather than `mimetype.startsWith("image/")`
 * (ADR-058). The old prefix test admitted `image/svg+xml`, and Cloudinary
 * stores SVG as an image — so a scripted SVG could be uploaded and would
 * execute for anyone who opened its raw delivery URL directly.
 *
 * Note what this does and does not do: `file.mimetype` is taken from the
 * multipart part header, so it is caller-supplied and this check does not
 * prove the bytes are really a PNG. It narrows *which* declared types are
 * accepted, which is what removes the SVG case. Cloudinary re-validates
 * the actual content on upload and rejects a non-image.
 */
const ALLOWED_MIME_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
]);

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        // AppError, not a bare Error — a bare one carries no statusCode and
        // isn't isOperational, so errorHandler turned a plainly invalid
        // upload into a 500 "Something went wrong." (ADR-058).
        return cb(
            new AppError("Only PNG, JPEG, WebP or GIF images are allowed.", 400),
            false,
        );
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

export default upload;