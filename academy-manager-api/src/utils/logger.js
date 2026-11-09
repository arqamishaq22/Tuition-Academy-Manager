import env from "../config/env.js";

/**
 * Lightweight, zero-dependency console logger utility.
 * Formats timestamps and log levels clearly for development and production.
 */
const isDev = env.NODE_ENV === "development";

export const logger = {
  info: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] \x1b[36m[INFO]\x1b[0m ${message}`, ...args);
  },

  success: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] \x1b[32m[SUCCESS]\x1b[0m ${message}`, ...args);
  },

  warn: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] \x1b[33m[WARN]\x1b[0m ${message}`, ...args);
  },

  error: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] \x1b[31m[ERROR]\x1b[0m ${message}`, ...args);
  },

  debug: (message, ...args) => {
    if (isDev) {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] \x1b[35m[DEBUG]\x1b[0m ${message}`, ...args);
    }
  },
};

export default logger;
