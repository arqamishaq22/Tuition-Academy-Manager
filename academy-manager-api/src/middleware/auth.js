import jwt from "jsonwebtoken";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

/**
 * Authentication middleware that verifies the incoming JSON Web Token (JWT).
 * Inspects both the HTTP Authorization header (Bearer scheme) and signed/unsigned cookies.
 * Attaches the decoded user profile to req.user for downstream handlers.
 */
export function authenticate(req, res, next) {
  try {
    let token = null;

    // 1. Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    // 2. Fallback to HttpOnly cookie
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw ApiError.unauthorized("Authentication required. Please provide a valid Bearer token.");
    }

    // Verify token using secret
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    // Attach decoded user data
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      next(ApiError.unauthorized("Authentication token has expired. Please refresh your session."));
    } else if (error.name === "JsonWebTokenError") {
      next(ApiError.unauthorized("Invalid authentication token."));
    } else {
      next(error);
    }
  }
}

export default authenticate;
