/**
 * Custom operational API Error class.
 * Extends the standard JavaScript Error to include HTTP statusCode and validation error arrays.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404, 409, 422, 500)
   * @param {string} message - Human readable error description
   * @param {Array} errors - Optional field-level error details (e.g. from validation)
   * @param {string|null} code - Optional error machine code (e.g. 'TOKEN_EXPIRED')
   */
  constructor(statusCode, message = "Internal Server Error", errors = [], code = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.isOperational = true; // Identifies known handled errors vs unexpected runtime bugs

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = "Bad Request", errors = [], code = null) {
    return new ApiError(400, msg, errors, code);
  }

  static unauthorized(msg = "Unauthorized access", errors = [], code = null) {
    return new ApiError(401, msg, errors, code);
  }

  static forbidden(msg = "Forbidden: you do not have permission", errors = [], code = null) {
    return new ApiError(403, msg, errors, code);
  }

  static notFound(msg = "Resource not found", errors = [], code = null) {
    return new ApiError(404, msg, errors, code);
  }

  static conflict(msg = "Resource already exists", errors = [], code = null) {
    return new ApiError(409, msg, errors, code);
  }

  static paymentRequired(msg = "Payment required / Subscription limit exceeded", errors = [], code = "PLAN_LIMIT_EXCEEDED") {
    return new ApiError(402, msg, errors, code);
  }

  static unprocessable(msg = "Validation failed", errors = [], code = null) {
    return new ApiError(422, msg, errors, code);
  }

  static internal(msg = "Internal Server Error", errors = [], code = null) {
    return new ApiError(500, msg, errors, code);
  }
}

export default ApiError;
