import { ZodError } from "zod";
import ApiError from "../utils/ApiError.js";
import { sendError } from "../utils/response.js";
import env from "../config/env.js";
import logger from "../utils/logger.js";

/**
 * Global centralized error-handling middleware.
 * Normalizes all error types (ApiError, Zod validation errors, MySQL database errors, JWT errors, syntax errors)
 * into a single unified JSON contract: { success: false, message: "...", errors: [...] }
 */
export function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors = [];
  let errorCode = err.code || null;

  // Log error details for server diagnostics
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`);
  if (env.NODE_ENV === "development" && err.stack) {
    logger.debug(err.stack);
  }

  // 1. Handled Operational ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
    errorCode = err.code || null;
  }
  // 2. Direct Zod Validation Error (if not caught by validate middleware)
  else if (err instanceof ZodError) {
    statusCode = 422;
    message = "Validation failed. Please verify your inputs.";
    errors = err.errors.map((e) => ({
      field: e.path.join(".").replace(/^(body|query|params)\./, ""),
      message: e.message,
    }));
  }
  // 3. MySQL 8 Database Errors
  else if (err.code || err.errno) {
    // Duplicate entry (e.g. unique email, duplicate roll number in class)
    if (err.errno === 1062 || err.code === "ER_DUP_ENTRY") {
      statusCode = 409;
      // Extract duplicate field if available from regex
      const match = err.sqlMessage?.match(/for key '(.+?)'/);
      const keyName = match ? match[1] : "field";
      message = `Duplicate record found. The ${keyName} already exists in the system.`;
      errors = [{ field: keyName, message: err.sqlMessage || "Duplicate entry" }];
    }
    // Foreign key constraint failure (e.g. invalid class_id or student referenced elsewhere)
    else if (
      err.errno === 1451 ||
      err.errno === 1452 ||
      err.code === "ER_ROW_IS_REFERENCED_2" ||
      err.code === "ER_NO_REFERENCED_ROW_2"
    ) {
      statusCode = 400;
      message =
        err.errno === 1451
          ? "Cannot delete or modify record because it is referenced by other active records."
          : "Referenced related record does not exist in the database.";
      errors = [{ message: err.sqlMessage || "Foreign key constraint failure" }];
    }
    // Data too long for column
    else if (err.errno === 1406 || err.code === "ER_DATA_TOO_LONG") {
      statusCode = 400;
      message = "Input data exceeds allowed column character length.";
      errors = [{ message: err.sqlMessage || "Data too long" }];
    }
    // Database connection failure
    else if (err.code === "ECONNREFUSED" || err.code === "PROTOCOL_CONNECTION_LOST") {
      statusCode = 503;
      message = "Database service is temporarily unavailable. Please verify MySQL is running.";
      errors = [{ message: err.message }];
    } else {
      // General SQL error
      statusCode = 500;
      message =
        env.NODE_ENV === "production"
          ? "A database error occurred."
          : `Database Error: ${err.sqlMessage || err.message}`;
      errors = env.NODE_ENV === "production" ? [] : [{ code: err.code, errno: err.errno }];
    }
  }
  // 4. JWT Authentication Errors
  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid or tampered authentication token.";
    errors = [{ message: err.message }];
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your authentication session has expired. Please log in again.";
    errors = [{ message: "Token expired", expiredAt: err.expiredAt }];
  }
  // 5. Body Parser JSON Syntax Error
  else if (err instanceof SyntaxError && "body" in err) {
    statusCode = 400;
    message = "Malformed JSON payload in request body.";
    errors = [{ message: err.message }];
  }
  // 6. Unknown / Unhandled Errors
  else {
    statusCode = err.status || 500;
    message =
      env.NODE_ENV === "production"
        ? "Something went wrong on the server. Please try again later."
        : err.message || "Internal Server Error";
    errors = env.NODE_ENV === "production" ? [] : [{ stack: err.stack }];
  }

  return sendError(res, message, errors, statusCode, errorCode);
}

export default errorHandler;
