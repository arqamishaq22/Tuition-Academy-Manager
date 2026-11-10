import bcrypt from "bcryptjs";
import { query, withTransaction } from "../config/db.js";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import { normalizePakistaniPhone, formatPakistaniPhone } from "../utils/phone.js";
import logger from "../utils/logger.js";

const PLAN_LIMITS = {
  free_pilot: 50,
  standard: 200,
  pro: Infinity,
};

/**
 * 1. GET Academy Settings Overview
 * Returns academy profile, fee settings, notification settings, and plan details.
 *
 * @param {number} academyId
 * @returns {Promise<object>}
 */
export async function getAcademySettings(academyId) {
  const rows = await query(
    `SELECT 
       id,
       name,
       slug,
       address,
       city,
       phone,
       email,
       logo_url,
       plan,
       fee_due_day,
       late_fee_enabled,
       late_fee_amount,
       reminder_template,
       notification_settings,
       is_active
     FROM academies
     WHERE id = :academyId LIMIT 1`,
    { academyId }
  );

  if (!rows || rows.length === 0) {
    throw ApiError.notFound("Academy profile not found.");
  }

  const a = rows[0];

  // Parse notification settings with default fallback
  let notifications = {
    whatsappReminders: true,
    absentAlerts: true,
    weeklyReports: false,
  };
  if (a.notification_settings) {
    try {
      const parsed = typeof a.notification_settings === "string" ? JSON.parse(a.notification_settings) : a.notification_settings;
      notifications = { ...notifications, ...parsed };
    } catch {
      // keep defaults on json parse failure
    }
  }

  // Active student count & plan limit
  const countRes = await query(
    `SELECT COUNT(*) AS active_students FROM students 
     WHERE academy_id = :academyId AND status = 'active' AND deleted_at IS NULL`,
    { academyId }
  );
  const currentStudents = Number(countRes[0]?.active_students || 0);
  const plan = a.plan || "free_pilot";
  const maxStudents = PLAN_LIMITS[plan] !== undefined ? PLAN_LIMITS[plan] : 50;
  const usagePercent = maxStudents !== Infinity
    ? Math.round((currentStudents / maxStudents) * 1000) / 10
    : 0;

  return {
    profile: {
      id: a.id,
      name: a.name,
      slug: a.slug,
      address: a.address,
      city: a.city,
      phone: a.phone ? formatPakistaniPhone(a.phone) : null,
      email: a.email,
      logoUrl: a.logo_url,
      isActive: Boolean(a.is_active),
    },
    fees: {
      feeDueDay: a.fee_due_day,
      lateFeeEnabled: Boolean(a.late_fee_enabled),
      lateFeeAmount: a.late_fee_amount,
      reminderTemplate: a.reminder_template || "Dear Parent, fee of Rs {amount} for {student} is due on {dueDate}. Please clear dues for {month}. - {academy}",
    },
    notifications,
    plan: {
      currentPlan: plan,
      currentStudents,
      maxStudents: maxStudents === Infinity ? "Unlimited" : maxStudents,
      usagePercent,
      isLimitReached: maxStudents !== Infinity && currentStudents >= maxStudents,
    },
  };
}

/**
 * 2. PUT /settings/profile
 * Updates academy basic details.
 *
 * @param {number} academyId
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateProfile(academyId, data) {
  const { name, address, city, phone, email } = data;

  const normalizedPhone = phone ? normalizePakistaniPhone(phone) : null;

  await query(
    `UPDATE academies SET
       name = :name,
       address = :address,
       city = :city,
       phone = :phone,
       email = :email
     WHERE id = :academyId`,
    {
      academyId,
      name: name.trim(),
      address: address ? address.trim() : null,
      city: city ? city.trim() : "Lahore",
      phone: normalizedPhone,
      email: email ? email.trim() : null,
    }
  );

  return (await getAcademySettings(academyId)).profile;
}

/**
 * 3. POST /settings/logo
 * Updates academy logo URL.
 *
 * @param {number} academyId
 * @param {string} logoUrl
 * @returns {Promise<{ logoUrl: string }>}
 */
export async function updateLogo(academyId, logoUrl) {
  await query(
    `UPDATE academies SET logo_url = :logoUrl WHERE id = :academyId`,
    { academyId, logoUrl }
  );

  return { logoUrl };
}

/**
 * 4. PUT /settings/fees
 * Updates monthly fee due day, late fee rules, and notification template.
 *
 * @param {number} academyId
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateFeeSettings(academyId, data) {
  const { feeDueDay, lateFeeEnabled, lateFeeAmount, reminderTemplate } = data;

  await query(
    `UPDATE academies SET
       fee_due_day = :feeDueDay,
       late_fee_enabled = :lateFeeEnabled,
       late_fee_amount = :lateFeeAmount,
       reminder_template = :reminderTemplate
     WHERE id = :academyId`,
    {
      academyId,
      feeDueDay: Number(feeDueDay),
      lateFeeEnabled: Boolean(lateFeeEnabled),
      lateFeeAmount: Number(lateFeeAmount || 0),
      reminderTemplate: reminderTemplate.trim(),
    }
  );

  return (await getAcademySettings(academyId)).fees;
}

/**
 * 5. PUT /settings/notifications
 * Updates notification automation preferences.
 *
 * @param {number} academyId
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateNotificationSettings(academyId, data) {
  const settingsJson = JSON.stringify({
    whatsappReminders: Boolean(data.whatsappReminders),
    absentAlerts: Boolean(data.absentAlerts),
    weeklyReports: Boolean(data.weeklyReports),
  });

  await query(
    `UPDATE academies SET notification_settings = :settingsJson WHERE id = :academyId`,
    { academyId, settingsJson }
  );

  return (await getAcademySettings(academyId)).notifications;
}

/**
 * 6. GET /settings/team
 * List all team members (owner, staff, teachers) of the academy.
 *
 * @param {number} academyId
 * @returns {Promise<Array<object>>}
 */
export async function getTeamList(academyId) {
  const rows = await query(
    `SELECT 
       u.id,
       u.name,
       u.email,
       u.phone,
       u.role,
       u.avatar_url,
       u.is_active,
       u.last_login_at,
       u.created_at,
       t.id AS teacher_id,
       t.qualification,
       t.subject,
       t.salary,
       t.joined_on
     FROM users u
     LEFT JOIN teachers t ON t.user_id = u.id AND t.academy_id = u.academy_id
     WHERE u.academy_id = :academyId
       AND u.deleted_at IS NULL
       AND u.role IN ('owner', 'staff', 'teacher')
     ORDER BY 
       CASE WHEN u.role = 'owner' THEN 0 WHEN u.role = 'staff' THEN 1 ELSE 2 END,
       u.id ASC`,
    { academyId }
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ? formatPakistaniPhone(r.phone) : null,
    role: r.role,
    avatarUrl: r.avatar_url,
    isActive: Boolean(r.is_active),
    lastLoginAt: r.last_login_at,
    createdAt: r.created_at,
    teacherProfile: r.role === "teacher"
      ? {
          teacherId: r.teacher_id,
          qualification: r.qualification,
          subject: r.subject,
          salary: r.salary,
          joinedOn: r.joined_on,
        }
      : null,
  }));
}

/**
 * 7. POST /settings/team/invite
 * Invites a new staff or teacher member with a temporary password and generates an invite link.
 *
 * @param {number} academyId
 * @param {object} data
 * @param {number} currentUserId
 * @returns {Promise<object>}
 */
export async function inviteTeamMember(academyId, data, currentUserId) {
  const { name, email, phone, role, subject, qualification, salary } = data;
  const normalizedPhone = normalizePakistaniPhone(phone);

  return await withTransaction(async (conn) => {
    // 1. Check email uniqueness within academy
    const [existing] = await conn.query(
      `SELECT id FROM users WHERE academy_id = :academyId AND email = :email AND deleted_at IS NULL LIMIT 1`,
      { academyId, email: email.trim().toLowerCase() }
    );

    if (existing && existing.length > 0) {
      throw ApiError.conflict("A user with this email address already exists in your academy.");
    }

    // 2. Generate temporary password
    const tempPassword = `Staff@${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // 3. Create User
    const [userRes] = await conn.query(
      `INSERT INTO users (academy_id, name, email, phone, password_hash, role, is_active)
       VALUES (:academyId, :name, :email, :phone, :passwordHash, :role, TRUE)`,
      {
        academyId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: normalizedPhone,
        passwordHash,
        role,
      }
    );

    const newUserId = userRes.insertId;

    // 4. If role is teacher, create corresponding record in teachers table
    let teacherId = null;
    if (role === "teacher") {
      const [teacherRes] = await conn.query(
        `INSERT INTO teachers (academy_id, user_id, name, phone, email, qualification, subject, salary, joined_on, is_active)
         VALUES (:academyId, :userId, :name, :phone, :email, :qualification, :subject, :salary, CURRENT_DATE(), TRUE)`,
        {
          academyId,
          userId: newUserId,
          name: name.trim(),
          phone: normalizedPhone,
          email: email.trim().toLowerCase(),
          qualification: qualification ? qualification.trim() : null,
          subject: subject ? subject.trim() : "General",
          salary: salary ? Number(salary) : 0,
        }
      );
      teacherId = teacherRes.insertId;
    }

    // 5. Generate and log invite link
    const baseUrl = env.CLIENT_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/login?email=${encodeURIComponent(email.trim().toLowerCase())}&role=${role}`;

    logger.info(`[TEAM INVITE] Invitation link generated for ${name} (${email}): ${inviteLink}`);

    // 6. Record activity log
    await conn.query(
      `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
       VALUES (:academyId, :userId, 'TEAM_MEMBER_INVITED', 'users', :newUserId, :meta)`,
      {
        academyId,
        userId: currentUserId,
        newUserId,
        meta: JSON.stringify({ name, email, role, inviteLink }),
      }
    );

    return {
      message: `Team member invited successfully as ${role}.`,
      user: {
        id: newUserId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: formatPakistaniPhone(normalizedPhone),
        role,
        teacherId,
      },
      temporaryPassword: tempPassword,
      inviteLink,
    };
  });
}

/**
 * 8. PATCH /settings/team/:userId
 * Updates role or active status.
 * CRITICAL RULE: The last owner can never be removed or demoted.
 *
 * @param {number} academyId
 * @param {number} targetUserId
 * @param {object} data
 * @param {number} currentUserId
 * @returns {Promise<object>}
 */
export async function updateTeamMember(academyId, targetUserId, data, currentUserId) {
  const tId = Number(targetUserId);

  const users = await query(
    `SELECT id, name, role, is_active FROM users 
     WHERE id = :tId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
    { tId, academyId }
  );

  if (!users || users.length === 0) {
    throw ApiError.notFound("Team member not found.");
  }

  const target = users[0];

  // Last owner guard
  if (target.role === "owner") {
    const isDemotion = data.role && data.role !== "owner";
    const isDeactivation = data.isActive === false;

    if (isDemotion || isDeactivation) {
      const ownerCountRes = await query(
        `SELECT COUNT(*) AS owner_count FROM users 
         WHERE academy_id = :academyId AND role = 'owner' AND is_active = TRUE AND deleted_at IS NULL`,
        { academyId }
      );
      const activeOwners = Number(ownerCountRes[0]?.owner_count || 0);

      if (activeOwners <= 1) {
        throw ApiError.badRequest("Cannot demote or deactivate the last remaining owner of the academy.");
      }
    }
  }

  const newRole = data.role !== undefined ? data.role : target.role;
  const newActive = data.isActive !== undefined ? Boolean(data.isActive) : Boolean(target.is_active);

  await query(
    `UPDATE users SET role = :newRole, is_active = :newActive WHERE id = :tId AND academy_id = :academyId`,
    { newRole, newActive, tId, academyId }
  );

  // Sync teacher table if active status changed
  if (data.isActive !== undefined) {
    await query(
      `UPDATE teachers SET is_active = :newActive WHERE user_id = :tId AND academy_id = :academyId`,
      { newActive, tId, academyId }
    );
  }

  return {
    id: tId,
    name: target.name,
    role: newRole,
    isActive: newActive,
    message: "Team member status updated successfully.",
  };
}

/**
 * 9. DELETE /settings/team/:userId
 * Soft deletes a team member.
 * CRITICAL RULE: The last owner can never be removed or demoted.
 *
 * @param {number} academyId
 * @param {number} targetUserId
 * @param {number} currentUserId
 * @returns {Promise<{ message: string, userId: number }>}
 */
export async function deleteTeamMember(academyId, targetUserId, currentUserId) {
  const tId = Number(targetUserId);

  const users = await query(
    `SELECT id, name, role FROM users 
     WHERE id = :tId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
    { tId, academyId }
  );

  if (!users || users.length === 0) {
    throw ApiError.notFound("Team member not found.");
  }

  const target = users[0];

  // Last owner guard
  if (target.role === "owner") {
    const ownerCountRes = await query(
      `SELECT COUNT(*) AS owner_count FROM users 
       WHERE academy_id = :academyId AND role = 'owner' AND is_active = TRUE AND deleted_at IS NULL`,
      { academyId }
    );
    const activeOwners = Number(ownerCountRes[0]?.owner_count || 0);

    if (activeOwners <= 1) {
      throw ApiError.badRequest("Cannot remove the last remaining owner of the academy.");
    }
  }

  // Soft delete user and deactivate teacher profile
  await query(
    `UPDATE users SET deleted_at = NOW(), is_active = FALSE WHERE id = :tId AND academy_id = :academyId`,
    { tId, academyId }
  );

  await query(
    `UPDATE teachers SET is_active = FALSE WHERE user_id = :tId AND academy_id = :academyId`,
    { tId, academyId }
  );

  return {
    message: "Team member removed successfully.",
    userId: tId,
  };
}

/**
 * 10. GET /settings/plan
 * Current subscription plan and student limit usage.
 *
 * @param {number} academyId
 * @returns {Promise<object>}
 */
export async function getPlanDetails(academyId) {
  const academies = await query(
    `SELECT plan FROM academies WHERE id = :academyId LIMIT 1`,
    { academyId }
  );

  if (!academies || academies.length === 0) {
    throw ApiError.notFound("Academy profile not found.");
  }

  const plan = academies[0].plan || "free_pilot";
  const countRes = await query(
    `SELECT COUNT(*) AS active_students FROM students 
     WHERE academy_id = :academyId AND status = 'active' AND deleted_at IS NULL`,
    { academyId }
  );
  const currentStudents = Number(countRes[0]?.active_students || 0);
  const maxLimit = PLAN_LIMITS[plan] !== undefined ? PLAN_LIMITS[plan] : 50;
  const isUnlimited = maxLimit === Infinity;

  const usagePercent = isUnlimited ? 0 : Math.round((currentStudents / maxLimit) * 1000) / 10;
  const remainingSlots = isUnlimited ? "Unlimited" : Math.max(0, maxLimit - currentStudents);

  return {
    currentPlan: plan,
    currentStudents,
    studentLimit: isUnlimited ? "Unlimited" : maxLimit,
    usagePercent,
    remainingSlots,
    isLimitReached: !isUnlimited && currentStudents >= maxLimit,
    availablePlans: [
      {
        plan: "free_pilot",
        name: "Free Pilot",
        studentLimit: 50,
        pricePkr: 0,
        description: "Best for new tuition centers and small home academies.",
      },
      {
        plan: "standard",
        name: "Standard",
        studentLimit: 200,
        pricePkr: 4999,
        description: "For growing tuition academies with multiple batches and teachers.",
      },
      {
        plan: "pro",
        name: "Pro Unlimited",
        studentLimit: "Unlimited",
        pricePkr: 9999,
        description: "For established educational institutes with unlimited students.",
      },
    ],
  };
}

export default {
  getAcademySettings,
  updateProfile,
  updateLogo,
  updateFeeSettings,
  updateNotificationSettings,
  getTeamList,
  inviteTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getPlanDetails,
};
