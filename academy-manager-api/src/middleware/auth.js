import jwt from "jsonwebtoken";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

/**
 * Authentication middleware that verifies the incoming Access Token (JWT).
 * Inspects the HTTP Authorization header (Bearer scheme) and fallback cookie.
 * Attaches decoded user credentials ({ id, sub, academyId, role }) to req.user.
 * Returns HTTP 401 with code 'TOKEN_EXPIRED' when the access token has expired.
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
      throw ApiError.unauthorized("Authentication token required. Please log in.");
    }

    // Verify token using secret
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    // Normalize user identity: sub is user ID
    req.user = {
      id: decoded.sub,
      sub: decoded.sub,
      academyId: decoded.academyId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      next(
        new ApiError(
          401,
          "Access token has expired. Please refresh your session.",
          [{ message: "Token expired", expiredAt: error.expiredAt }],
          "TOKEN_EXPIRED"
        )
      );
    } else if (error.name === "JsonWebTokenError") {
      next(ApiError.unauthorized("Invalid authentication token."));
    } else {
      next(error);
    }
  }
}

export default authenticate;
