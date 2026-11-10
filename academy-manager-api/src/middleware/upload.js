import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import ApiError from "../utils/ApiError.js";

// Root upload directory
const rootUploadDir = path.resolve(process.cwd(), "uploads");

// Ensure root and sub-directories exist
const subDirs = ["students", "logos", "documents", "general"];
if (!fs.existsSync(rootUploadDir)) {
  fs.mkdirSync(rootUploadDir, { recursive: true });
}
for (const sub of subDirs) {
  const dirPath = path.resolve(rootUploadDir, sub);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Allowed MIME types & extensions
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

/**
 * File filter checking both extension and real MIME type.
 */
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (ALLOWED_EXTENSIONS.has(ext) && ALLOWED_MIME_TYPES.has(mime)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Invalid file format '${file.mimetype}'. Only JPG, JPEG, PNG, WEBP, and PDF files under 2MB are permitted.`
      ),
      false
    );
  }
}

/**
 * Factory creating multer uploader for a designated folder under uploads/<type>/.
 * Uses random UUID filenames and enforces 2MB limit.
 *
 * @param {string} type - Upload sub-folder name
 * @returns {multer.Multer}
 */
export function createUploadMiddleware(type = "general") {
  const targetDir = path.resolve(rootUploadDir, type);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, targetDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${type}-${uuidv4()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB max
    },
    fileFilter,
  });
}

// Specific upload middlewares
export const uploadStudentPhoto = createUploadMiddleware("students");
export const uploadLogo = createUploadMiddleware("logos");
export const uploadDocument = createUploadMiddleware("documents");
export const upload = createUploadMiddleware("general");

// CSV Bulk Import Storage (in-memory buffer, max 2MB)
export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
  fileFilter: (req, file, cb) => {
    const isCsvMime = [
      "text/csv",
      "application/csv",
      "text/x-csv",
      "application/vnd.ms-excel",
      "text/plain",
    ].includes(file.mimetype);
    const hasCsvExt = file.originalname.toLowerCase().endsWith(".csv");

    if (isCsvMime || hasCsvExt) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest("Invalid file type. Please upload a valid CSV file (max 2MB)."), false);
    }
  },
});

export default upload;
