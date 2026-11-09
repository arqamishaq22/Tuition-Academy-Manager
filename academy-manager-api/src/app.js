import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import env from "./config/env.js";
import routes from "./routes/index.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

// Initialize Express application
const app = express();

/**
 * 1. Security Headers (Helmet)
 */
app.use(helmet());

/**
 * 2. Cross-Origin Resource Sharing (CORS)
 * Allows requests from CLIENT_URL with credentials (cookies / auth headers)
 */
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

/**
 * 3. HTTP Response Compression (Gzip / Deflate)
 */
app.use(compression());

/**
 * 4. Request Logging (Morgan in dev format)
 */
if (env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

/**
 * 5. Body Parsers (JSON & URL-Encoded with 1mb payload limit)
 */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

/**
 * 6. Cookie Parser
 */
app.use(cookieParser());

/**
 * 7. Global Rate Limiter
 * 100 requests per 15 minutes per client IP to safeguard against brute force / DoS
 */
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests from this IP address. Please try again after 15 minutes.",
    errors: [{ message: "Rate limit exceeded. Max 100 requests per 15 minutes." }],
  },
});
app.use(globalRateLimiter);

/**
 * 8. Mount Main API Routes under /api/v1
 */
app.use("/api/v1", routes);

/**
 * 9. 404 Catch-All Not Found Middleware
 */
app.use(notFound);

/**
 * 10. Global Centralized Error Handler
 */
app.use(errorHandler);

export default app;

