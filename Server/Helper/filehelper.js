"use strict";
import multer from "multer";
const storage = multer.diskStorage({
    destination: (req, res, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null,
            new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
        );
    },
});
const filefilter = (req, file, cb) => {
    // List of allowed video MIME types
    const allowedVideoTypes = [
        "video/mp4", 
        "video/mpeg", 
        "video/quicktime", 
        "video/x-msvideo", 
        "video/x-ms-wmv"
    ];

    // Check if the file type is in the allowed list
    if (allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // Provide a detailed error message
        cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload a video file.`), false);
    }
}
const upload = multer({ storage: storage, fileFilter: filefilter });
export default upload