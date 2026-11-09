import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { query, withTransaction } from "../config/db.js";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";

/**
 * Helper to compute SHA-256 hash of a token.
 */
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generate Access and Refresh JWT Tokens.
 * Access Token: 15 minutes, payload { sub: userId, academyId, role }
 * Refresh Token: 7 days, payload { sub: userId, academyId, role, jti }
 */
function createTokens(user) {
  const accessPayload = {
    sub: user.id,
    academyId: user.academy_id,
    role: user.role,
  };

  const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  });

  const refreshJti = uuidv4();
  const refreshPayload = {
    sub: user.id,
    academyId: user.academy_id,
    role: user.role,
    jti: refreshJti,
  };

  const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  });

  return { accessToken, refreshToken };
}

/**
 * Generate unique academy slug from academy name.
 */
async function generateUniqueSlug(conn, name) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "academy";

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const [existing] = await conn.query(
      "SELECT id FROM academies WHERE slug = :slug LIMIT 1",
      { slug }
    );
    if (!existing || existing.length === 0) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Save hashed refresh token to database.
 */
async function saveRefreshToken(connOrQuery, userId, refreshToken, userAgent = null, ip = null) {
  const tokenHash = hashToken(refreshToken);
  // Calculate expiry date (7 days from now)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const sql = `
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip)
    VALUES (:userId, :tokenHash, :expiresAt, :userAgent, :ip)
  `;
  const params = { userId, tokenHash, expiresAt, userAgent, ip };

  if (typeof connOrQuery === "function") {
    await connOrQuery(sql, params);
  } else if (connOrQuery && typeof connOrQuery.query === "function") {
    await connOrQuery.query(sql, params);
  } else {
    await query(sql, params);
  }
}

// ============================================================================
// 1. SIGNUP (Transaction: Academy + Owner User + Default Settings + Audit)
// ============================================================================
export async function signup(data, userAgent = null, ip = null) {
  // Check if email already taken
  const existingUser = await query(
    "SELECT id FROM users WHERE email = :email AND deleted_at IS NULL LIMIT 1",
    { email: data.email }
  );

  if (existingUser && existingUser.length > 0) {
    throw ApiError.conflict("An account with this email address already exists.");
  }

  return await withTransaction(async (conn) => {
    // 1. Generate unique slug
    const slug = await generateUniqueSlug(conn, data.academyName);

    // 2. Insert Academy
    const [academyResult] = await conn.query(
      `INSERT INTO academies (name, slug, city, phone, plan, fee_due_day, late_fee_enabled, late_fee_amount, is_active)
       VALUES (:name, :slug, :city, :phone, 'free_pilot', 10, TRUE, 200, TRUE)`,
      {
        name: data.academyName,
        slug,
        city: data.city || "Lahore",
        phone: data.phone,
      }
    );
    const academyId = academyResult.insertId;

    // 3. Hash Password (cost 12)
    const passwordHash = await bcrypt.hash(data.password, 12);

    // 4. Create Owner User
    const [userResult] = await conn.query(
      `INSERT INTO users (academy_id, name, email, phone, password_hash, role, is_active, last_login_at)
       VALUES (:academyId, :name, :email, :phone, :passwordHash, 'owner', TRUE, NOW())`,
      {
        academyId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
      }
    );
    const userId = userResult.insertId;

    // 5. Insert Optional Subjects if provided
    if (Array.isArray(data.subjects) && data.subjects.length > 0) {
      for (const subName of data.subjects) {
        if (subName && subName.trim()) {
          await conn.query(
            "INSERT INTO subjects (academy_id, name) VALUES (:academyId, :name) ON DUPLICATE KEY UPDATE name=name",
            { academyId, name: subName.trim() }
          );
        }
      }
    }

    // 6. Generate Tokens
    const user = { id: userId, academy_id: academyId, role: "owner" };
    const { accessToken, refreshToken } = createTokens(user);

    // 7. Store Refresh Token Hash
    await saveRefreshToken(conn, userId, refreshToken, userAgent, ip);

    // 8. Log in Activity Logs
    await conn.query(
      `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
       VALUES (:academyId, :userId, 'USER_SIGNUP', 'users', :userId, :meta)`,
      {
        academyId,
        userId,
        meta: JSON.stringify({ academyName: data.academyName, role: "owner", ip }),
      }
    );

    return {
      user: {
        id: userId,
        academyId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: "owner",
      },
      academy: {
        id: academyId,
        name: data.academyName,
        slug,
        city: data.city || "Lahore",
        plan: "free_pilot",
      },
      accessToken,
      refreshToken,
    };
  });
}

// ============================================================================
// 2. LOGIN (Account Lockout & Generic Errors)
// ============================================================================
export async function login(email, password, userAgent = null, ip = null) {
  const genericError = ApiError.unauthorized("Invalid email or password.");

  const users = await query(
    `SELECT u.*, a.name AS academy_name, a.slug AS academy_slug, a.city AS academy_city, 
            a.plan AS academy_plan, a.is_active AS academy_active
     FROM users u
     JOIN academies a ON u.academy_id = a.id
     WHERE u.email = :email AND u.deleted_at IS NULL LIMIT 1`,
    { email }
  );

  if (!users || users.length === 0) {
    throw genericError;
  }

  const user = users[0];

  // Block inactive users or academies
  if (!user.is_active || !user.academy_active) {
    throw ApiError.forbidden("Your account or academy has been deactivated. Please contact administration.");
  }

  // Check Account Lockout (15 minutes lockout after 5 failed attempts)
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / (60 * 1000));
    throw ApiError.unauthorized(
      `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`
    );
  }

  // Compare Password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const nextFailed = (user.failed_login_count || 0) + 1;
    if (nextFailed >= 5) {
      await query(
        `UPDATE users 
         SET failed_login_count = :nextFailed, locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) 
         WHERE id = :id`,
        { nextFailed, id: user.id }
      );
      throw ApiError.unauthorized(
        "Account has been locked for 15 minutes due to 5 consecutive failed login attempts."
      );
    } else {
      await query(
        `UPDATE users SET failed_login_count = :nextFailed WHERE id = :id`,
        { nextFailed, id: user.id }
      );
      throw genericError;
    }
  }

  // Successful login: reset failed count and update last_login_at
  await query(
    `UPDATE users 
     SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW() 
     WHERE id = :id`,
    { id: user.id }
  );

  const { accessToken, refreshToken } = createTokens(user);
  await saveRefreshToken(query, user.id, refreshToken, userAgent, ip);

  // Log in Activity Logs
  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'USER_LOGIN', 'users', :userId, :meta)`,
    {
      academyId: user.academy_id,
      userId: user.id,
      meta: JSON.stringify({ email: user.email, role: user.role, ip }),
    }
  );

  return {
    user: {
      id: user.id,
      academyId: user.academy_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatar_url,
      lastLoginAt: new Date().toISOString(),
    },
    academy: {
      id: user.academy_id,
      name: user.academy_name,
      slug: user.academy_slug,
      city: user.academy_city,
      plan: user.academy_plan,
    },
    accessToken,
    refreshToken,
  };
}

// ============================================================================
// 3. PARENT LOGIN (Phone Number & Password)
// ============================================================================
export async function parentLogin(phone, password, userAgent = null, ip = null) {
  const genericError = ApiError.unauthorized("Invalid phone number or password.");

  const users = await query(
    `SELECT u.*, a.name AS academy_name, a.slug AS academy_slug, a.city AS academy_city, 
            a.plan AS academy_plan, a.is_active AS academy_active
     FROM users u
     JOIN academies a ON u.academy_id = a.id
     WHERE u.phone = :phone AND u.role = 'parent' AND u.deleted_at IS NULL LIMIT 1`,
    { phone }
  );

  if (!users || users.length === 0) {
    throw genericError;
  }

  const user = users[0];

  if (!user.is_active || !user.academy_active) {
    throw ApiError.forbidden("Your parent account has been deactivated.");
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / (60 * 1000));
    throw ApiError.unauthorized(
      `Account is temporarily locked. Please try again in ${remainingMinutes} minute(s).`
    );
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const nextFailed = (user.failed_login_count || 0) + 1;
    if (nextFailed >= 5) {
      await query(
        `UPDATE users SET failed_login_count = :nextFailed, locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = :id`,
        { nextFailed, id: user.id }
      );
      throw ApiError.unauthorized("Account has been locked for 15 minutes due to 5 failed attempts.");
    } else {
      await query(`UPDATE users SET failed_login_count = :nextFailed WHERE id = :id`, {
        nextFailed,
        id: user.id,
      });
      throw genericError;
    }
  }

  await query(
    `UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW() WHERE id = :id`,
    { id: user.id }
  );

  const { accessToken, refreshToken } = createTokens(user);
  await saveRefreshToken(query, user.id, refreshToken, userAgent, ip);

  return {
    user: {
      id: user.id,
      academyId: user.academy_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: "parent",
      avatarUrl: user.avatar_url,
    },
    academy: {
      id: user.academy_id,
      name: user.academy_name,
      slug: user.academy_slug,
    },
    accessToken,
    refreshToken,
  };
}

// ============================================================================
// 4. REFRESH TOKEN (Rotation & Expiry Validation)
// ============================================================================
export async function refresh(oldRefreshToken, userAgent = null, ip = null) {
  if (!oldRefreshToken) {
    throw ApiError.unauthorized("Refresh token is required.");
  }

  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token. Please log in again.");
  }

  const tokenHash = hashToken(oldRefreshToken);

  // Check database for active token
  const tokenRows = await query(
    `SELECT * FROM refresh_tokens 
     WHERE token_hash = :tokenHash AND revoked_at IS NULL AND expires_at > NOW() 
     LIMIT 1`,
    { tokenHash }
  );

  if (!tokenRows || tokenRows.length === 0) {
    throw ApiError.unauthorized("Refresh token has been revoked or expired. Please log in again.");
  }

  const tokenRecord = tokenRows[0];

  // Load user
  const users = await query(
    `SELECT id, academy_id, role, is_active FROM users WHERE id = :userId AND deleted_at IS NULL LIMIT 1`,
    { userId: tokenRecord.user_id }
  );

  if (!users || users.length === 0 || !users[0].is_active) {
    throw ApiError.unauthorized("User account not found or deactivated.");
  }

  const user = users[0];

  // Rotate: Revoke the old refresh token
  await query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = :id`, {
    id: tokenRecord.id,
  });

  // Issue new token pair
  const { accessToken, refreshToken: newRefreshToken } = createTokens(user);
  await saveRefreshToken(query, user.id, newRefreshToken, userAgent, ip);

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

// ============================================================================
// 5. LOGOUT & LOGOUT-ALL
// ============================================================================
export async function logout(refreshToken, userId = null, academyId = null) {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = :tokenHash AND revoked_at IS NULL`,
      { tokenHash }
    );
  }

  if (userId && academyId) {
    await query(
      `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
       VALUES (:academyId, :userId, 'USER_LOGOUT', 'users', :userId, :meta)`,
      {
        academyId,
        userId,
        meta: JSON.stringify({ timestamp: new Date().toISOString() }),
      }
    );
  }

  return { message: "Logged out successfully" };
}

export async function logoutAll(userId, academyId) {
  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = :userId AND revoked_at IS NULL`,
    { userId }
  );

  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'USER_LOGOUT_ALL', 'users', :userId, :meta)`,
    {
      academyId,
      userId,
      meta: JSON.stringify({ message: "Revoked all active sessions" }),
    }
  );

  return { message: "All sessions have been revoked successfully." };
}

// ============================================================================
// 6. GET ME & UPDATE PROFILE
// ============================================================================
export async function getMe(userId, academyId) {
  const users = await query(
    `SELECT u.id, u.academy_id, u.name, u.email, u.phone, u.role, u.avatar_url, u.last_login_at, u.created_at,
            a.name AS academy_name, a.slug AS academy_slug, a.city AS academy_city, a.phone AS academy_phone,
            a.email AS academy_email, a.logo_url AS academy_logo_url, a.plan AS academy_plan,
            a.fee_due_day AS academy_fee_due_day, a.late_fee_enabled AS academy_late_fee_enabled,
            a.late_fee_amount AS academy_late_fee_amount
     FROM users u
     JOIN academies a ON u.academy_id = a.id
     WHERE u.id = :userId AND u.academy_id = :academyId AND u.deleted_at IS NULL LIMIT 1`,
    { userId, academyId }
  );

  if (!users || users.length === 0) {
    throw ApiError.notFound("User not found.");
  }

  const row = users[0];
  return {
    user: {
      id: row.id,
      academyId: row.academy_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      avatarUrl: row.avatar_url,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
    },
    academy: {
      id: row.academy_id,
      name: row.academy_name,
      slug: row.academy_slug,
      city: row.academy_city,
      phone: row.academy_phone,
      email: row.academy_email,
      logoUrl: row.academy_logo_url,
      plan: row.academy_plan,
      feeDueDay: row.academy_fee_due_day,
      lateFeeEnabled: Boolean(row.academy_late_fee_enabled),
      lateFeeAmount: row.academy_late_fee_amount,
    },
  };
}

export async function updateProfile(userId, academyId, data) {
  const fields = [];
  const params = { userId, academyId };

  if (data.name !== undefined) {
    fields.push("name = :name");
    params.name = data.name;
  }
  if (data.phone !== undefined) {
    fields.push("phone = :phone");
    params.phone = data.phone;
  }
  if (data.avatarUrl !== undefined) {
    fields.push("avatar_url = :avatarUrl");
    params.avatarUrl = data.avatarUrl;
  }

  if (fields.length > 0) {
    await query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = :userId AND academy_id = :academyId`,
      params
    );
  }

  return await getMe(userId, academyId);
}

// ============================================================================
// 7. CHANGE PASSWORD
// ============================================================================
export async function changePassword(userId, academyId, currentPassword, newPassword) {
  const users = await query(
    `SELECT password_hash FROM users WHERE id = :userId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
    { userId, academyId }
  );

  if (!users || users.length === 0) {
    throw ApiError.notFound("User not found.");
  }

  const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
  if (!isMatch) {
    throw ApiError.badRequest("Current password does not match.");
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await query(
    `UPDATE users SET password_hash = :newHash WHERE id = :userId AND academy_id = :academyId`,
    { newHash, userId, academyId }
  );

  // Revoke all other refresh tokens
  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = :userId AND revoked_at IS NULL`,
    { userId }
  );

  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'PASSWORD_CHANGED', 'users', :userId, :meta)`,
    {
      academyId,
      userId,
      meta: JSON.stringify({ message: "Password updated and other sessions revoked" }),
    }
  );

  return { message: "Password changed successfully. All other active sessions have been revoked." };
}

// ============================================================================
// 8. FORGOT & RESET PASSWORD
// ============================================================================
export async function forgotPassword(email) {
  const genericMessage =
    "If an account with that email exists, a password reset link has been generated.";

  const users = await query(
    `SELECT id, email, academy_id FROM users WHERE email = :email AND deleted_at IS NULL LIMIT 1`,
    { email }
  );

  if (!users || users.length === 0) {
    // Return same message to prevent email enumeration
    return { message: genericMessage };
  }

  const user = users[0];
  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(resetToken);

  // Store hashed token with 30-minute expiry
  await query(
    `UPDATE users 
     SET reset_password_token_hash = :tokenHash, 
         reset_password_expires_at = DATE_ADD(NOW(), INTERVAL 30 MINUTE)
     WHERE id = :userId`,
    { tokenHash, userId: user.id }
  );

  // Log reset link to server console for development/testing
  const resetLink = `${env.CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(
    user.email
  )}`;
  logger.info(`================================================================`);
  logger.info(`🔑 [PASSWORD RESET] Link generated for: ${user.email}`);
  logger.info(`   Reset Link: ${resetLink}`);
  logger.info(`   Expires in 30 minutes.`);
  logger.info(`================================================================`);

  return { message: genericMessage };
}

export async function resetPassword(token, email, newPassword) {
  const tokenHash = hashToken(token);

  const users = await query(
    `SELECT id, academy_id FROM users 
     WHERE email = :email 
       AND reset_password_token_hash = :tokenHash 
       AND reset_password_expires_at > NOW() 
       AND deleted_at IS NULL LIMIT 1`,
    { email, tokenHash }
  );

  if (!users || users.length === 0) {
    throw ApiError.badRequest("Invalid or expired password reset token.");
  }

  const user = users[0];
  const newHash = await bcrypt.hash(newPassword, 12);

  // Update password, clear reset token, reset lockout
  await query(
    `UPDATE users 
     SET password_hash = :newHash, 
         reset_password_token_hash = NULL, 
         reset_password_expires_at = NULL,
         failed_login_count = 0,
         locked_until = NULL
     WHERE id = :userId`,
    { newHash, userId: user.id }
  );

  // Revoke all active sessions
  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = :userId AND revoked_at IS NULL`,
    { userId: user.id }
  );

  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'PASSWORD_RESET', 'users', :userId, :meta)`,
    {
      academyId: user.academy_id,
      userId: user.id,
      meta: JSON.stringify({ message: "Password reset completed via token" }),
    }
  );

  return {
    message: "Password has been reset successfully. You can now log in with your new password.",
  };
}

export default {
  signup,
  login,
  parentLogin,
  refresh,
  logout,
  logoutAll,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
