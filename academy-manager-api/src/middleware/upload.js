import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import ApiError from "../utils/ApiError.js";

// Ensure root uploads and sub-directories exist on disk
const rootUploadDir = path.resolve(process.cwd(), "uploads");
const studentPhotoDir = path.resolve(rootUploadDir, "students");
const logoUploadDir = path.resolve(rootUploadDir, "logos");

if (!fs.existsSync(rootUploadDir)) {
  fs.mkdirSync(rootUploadDir, { recursive: true });
}
if (!fs.existsSync(studentPhotoDir)) {
  fs.mkdirSync(studentPhotoDir, { recursive: true });
}
if (!fs.existsSync(logoUploadDir)) {
  fs.mkdirSync(logoUploadDir, { recursive: true });
}

// 1. General disk storage
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, rootUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const upload = multer({
  storage: generalStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest(`Unsupported file format: ${file.mimetype}`), false);
    }
  },
});

// 2. CSV Bulk Import Storage (in-memory buffer, max 2MB)
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
      cb(ApiError.badRequest("Invalid file type. Please upload a valid CSV file."), false);
    }
  },
});

// 3. Student Photo Upload Storage (disk storage in uploads/students, max 2MB, JPG or PNG)
const studentPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, studentPhotoDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `student-${uuidv4()}${ext}`);
  },
});

export const uploadStudentPhoto = multer({
  storage: studentPhotoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        ApiError.badRequest("Only JPG and PNG images are allowed for student photos (max 2MB)."),
        false
      );
    }
  },
});

// 4. Academy Logo Storage (disk storage in uploads/logos, max 1MB, JPG or PNG)
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logoUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo-${uuidv4()}${ext}`);
  },
});

export const uploadLogo = multer({
  storage: logoStorage,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        ApiError.badRequest("Only JPG and PNG images are allowed for academy logo (max 1MB)."),
        false
      );
    }
  },
});

export default upload;
