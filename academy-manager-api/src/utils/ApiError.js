/**
 * Custom operational API Error class.
 * Extends the standard JavaScript Error to include HTTP statusCode and validation error arrays.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404, 409, 422, 500)
   * @param {string} message - Human readable error description
   * @param {Array} errors - Optional field-level error details (e.g. from validation)
   */
  constructor(statusCode, message = "Internal Server Error", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // Identifies known handled errors vs unexpected runtime bugs

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = "Bad Request", errors = []) {
    return new ApiError(400, msg, errors);
  }

  static unauthorized(msg = "Unauthorized access", errors = []) {
    return new ApiError(401, msg, errors);
  }

  static forbidden(msg = "Forbidden: you do not have permission", errors = []) {
    return new ApiError(403, msg, errors);
  }

  static notFound(msg = "Resource not found", errors = []) {
    return new ApiError(404, msg, errors);
  }

  static conflict(msg = "Resource already exists", errors = []) {
    return new ApiError(409, msg, errors);
  }

  static unprocessable(msg = "Validation failed", errors = []) {
    return new ApiError(422, msg, errors);
  }

  static internal(msg = "Internal Server Error", errors = []) {
    return new ApiError(500, msg, errors);
  }
}

export default ApiError;
