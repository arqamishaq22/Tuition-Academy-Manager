import app from "./app.js";
import env from "./config/env.js";
import { testConnection, pool } from "./config/db.js";
import logger from "./utils/logger.js";
import { initJobs } from "./jobs/index.js";

let server;

async function startServer() {
  try {
    // 1. Test MySQL 8 Database Connection
    logger.info("Verifying MySQL database connection...");
    try {
      await testConnection();
      logger.success(
        `✓ MySQL Database connected successfully [${env.DB_NAME} on ${env.DB_HOST}:${env.DB_PORT}]`
      );
    } catch (dbError) {
      logger.warn(
        `⚠ Database connection could not be established: ${dbError.message}`
      );
      logger.warn(
        "Server will start, but database-dependent endpoints will return 503 until MySQL is running."
      );
    }

    // 2. Start HTTP Server
    server = app.listen(env.PORT, () => {
      logger.success(
        `🚀 Academy Manager API server listening on http://localhost:${env.PORT}`
      );
      logger.info(`   - Environment:   ${env.NODE_ENV}`);
      logger.info(`   - Client Origin: ${env.CLIENT_URL}`);
      logger.info(`   - Health Check:  http://localhost:${env.PORT}/api/v1/health`);
    });

    // 3. Initialize background cron jobs
    initJobs();
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

// ============================================================================
// Graceful Shutdown & Process Signal Handling
// ============================================================================
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      logger.info("✓ HTTP server stopped accepting new requests.");
      try {
        await pool.end();
        logger.info("✓ MySQL database connection pool closed.");
      } catch (err) {
        logger.error("Error closing database pool:", err);
      }
      process.exit(0);
    });

    // Force close if graceful shutdown takes longer than 10 seconds
    setTimeout(() => {
      logger.error("Could not close connections in time, forcefully shutting down.");
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ============================================================================
// Unhandled Promise Rejections & Uncaught Exceptions
// ============================================================================
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection at:", promise, "reason:", reason);
  // In production, you may choose to log and restart or exit
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception thrown:", error);
  gracefulShutdown("uncaughtException");
});

// Launch server
startServer();

