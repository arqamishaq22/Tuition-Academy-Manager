import ApiError from "../utils/ApiError.js";

/**
 * Catches unhandled routes that do not match any registered endpoints
 * and forwards a 404 ApiError to the global errorHandler.
 */
export function notFound(req, res, next) {
  next(
    new ApiError(
      404,
      `Endpoint not found: [${req.method}] ${req.originalUrl}. Please check the API documentation.`
    )
  );
}

export default notFound;
