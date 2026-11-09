import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, withTransaction } from "../config/db.js";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

/**
 * Generates Access and Refresh JWT Tokens.
 */
function generateTokens(payload) {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  });

  return { accessToken, refreshToken };
}

export async function register(data) {
  const existingUser = await query("SELECT id FROM users WHERE email = :email LIMIT 1", {
    email: data.email,
  });

  if (existingUser && existingUser.length > 0) {
    throw ApiError.conflict("An account with this email already exists.");
  }

  return await withTransaction(async (conn) => {
    // 1. Create Academy
    const [academyResult] = await conn.query(
      "INSERT INTO academies (name, city) VALUES (:name, :city)",
      { name: data.academyName, city: data.city || "Lahore" }
    );
    const academyId = academyResult.insertId;

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. Create Admin User
    const [userResult] = await conn.query(
      `INSERT INTO users (academy_id, full_name, email, password_hash, phone, role) 
       VALUES (:academyId, :fullName, :email, :passwordHash, :phone, 'admin')`,
      {
        academyId,
        fullName: data.fullName,
        email: data.email,
        passwordHash: hashedPassword,
        phone: data.phone || null,
      }
    );
    const userId = userResult.insertId;

    const payload = {
      id: userId,
      academyId,
      email: data.email,
      role: "admin",
      name: data.fullName,
    };

    const tokens = generateTokens(payload);

    return {
      user: {
        id: userId,
        academyId,
        fullName: data.fullName,
        email: data.email,
        role: "admin",
      },
      tokens,
    };
  });
}

export async function login(email, password) {
  const users = await query(
    `SELECT u.id, u.academy_id, u.full_name, u.email, u.password_hash, u.role, a.name AS academy_name
     FROM users u
     JOIN academies a ON u.academy_id = a.id
     WHERE u.email = :email LIMIT 1`,
    { email }
  );

  if (!users || users.length === 0) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  const user = users[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  const payload = {
    id: user.id,
    academyId: user.academy_id,
    email: user.email,
    role: user.role,
    name: user.full_name,
  };

  const tokens = generateTokens(payload);

  return {
    user: {
      id: user.id,
      academyId: user.academy_id,
      academyName: user.academy_name,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    },
    tokens,
  };
}

export async function refresh(token) {
  if (!token) {
    throw ApiError.unauthorized("Refresh token is required.");
  }

  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const users = await query("SELECT id, academy_id, email, role, full_name FROM users WHERE id = :id LIMIT 1", {
      id: decoded.id,
    });

    if (!users || users.length === 0) {
      throw ApiError.unauthorized("User session not found.");
    }

    const user = users[0];
    const payload = {
      id: user.id,
      academyId: user.academy_id,
      email: user.email,
      role: user.role,
      name: user.full_name,
    };

    return generateTokens(payload);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token.");
  }
}

export default {
  register,
  login,
  refresh,
};
