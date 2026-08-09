import multer from "multer";

/**
 * We use memoryStorage instead of diskStorage because we don't want to
 * save the file to our own server's disk at all — we only need it in
 * memory (as a Buffer) long enough to forward it to Cloudinary.
 * req.file.buffer is where that raw file data will live.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");

    if (!isImage) {
        return cb(new Error("Only image files are allowed."), false);
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