/**
 * Wraps an async route handler or middleware.
 * Catches any rejected promises and forwards them to Express next(error),
 * eliminating the need for repetitive try/catch blocks in controllers.
 *
 * @param {Function} fn - Async controller function: async (req, res, next) => { ... }
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
