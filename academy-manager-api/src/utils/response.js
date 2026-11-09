/**
 * Standardized API Response Helpers.
 * All successful responses follow: { success: true, data: ..., meta: ... }
 * All failure responses follow:   { success: false, message: "...", errors: [...] }
 */

/**
 * Sends a successful JSON response.
 * @param {import('express').Response} res - Express response object
 * @param {any} data - Response payload
 * @param {object|null} meta - Optional metadata (pagination, counts, timestamps)
 * @param {number} status - HTTP status code (defaults to 200)
 */
export function sendSuccess(res, data = null, meta = null, status = 200) {
  const payload = {
    success: true,
    data,
  };

  if (meta !== null && meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(status).json(payload);
}

/**
 * Sends an error JSON response.
 * @param {import('express').Response} res - Express response object
 * @param {string} message - Error description
 * @param {Array} errors - Optional field-level error details
 * @param {number} status - HTTP status code (defaults to 500)
 */
export function sendError(res, message = "Internal Server Error", errors = [], status = 500) {
  return res.status(status).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors],
  });
}

export default {
  sendSuccess,
  sendError,
};
