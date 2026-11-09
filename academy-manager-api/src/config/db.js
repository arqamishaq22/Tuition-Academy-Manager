import mysql from "mysql2/promise";
import env from "./env.js";

/**
 * MySQL 8 Connection Pool using mysql2 Promise API.
 * Uses connectionLimit 10, namedPlaceholders, dateStrings and Pakistan timezone (+05:00).
 * No ORM is used - plain parameterized SQL queries only.
 */
export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: 10,
  namedPlaceholders: true,
  dateStrings: true,
  timezone: "+05:00",
  waitForConnections: true,
  queueLimit: 0,
});

/**
 * Query helper to run plain parameterized SQL queries.
 * @param {string} sql - SQL statement with ? or :named placeholders
 * @param {Array|Object} params - Array or Object of parameters
 * @returns {Promise<Array>} - Query result rows
 */
export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Transaction helper that handles begin, commit, rollback, and connection release.
 * Ensures atomicity when performing multiple related database operations.
 * @param {Function} callback - Async function that receives the active connection: async (conn) => { ... }
 * @returns {Promise<any>} - Returns whatever the callback resolves to
 */
export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Test the database connection.
 * @returns {Promise<boolean>}
 */
export async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

export default {
  pool,
  query,
  withTransaction,
  testConnection,
};
