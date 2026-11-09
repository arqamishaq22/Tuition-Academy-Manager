import { query } from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export async function getAllClasses(academyId) {
  return await query(
    `SELECT c.*, 
            COUNT(s.id) AS total_students,
            ROUND(AVG(COALESCE(s.attendance_pct, 85)), 1) AS avg_attendance
     FROM classes c
     LEFT JOIN students s ON s.class_id = c.id
     WHERE c.academy_id = :academyId
     GROUP BY c.id
     ORDER BY c.id ASC`,
    { academyId }
  );
}

export async function getClassById(academyId, id) {
  const classes = await query(
    `SELECT * FROM classes WHERE id = :id AND academy_id = :academyId LIMIT 1`,
    { id, academyId }
  );
  if (!classes || classes.length === 0) {
    throw ApiError.notFound("Class not found.");
  }
  return classes[0];
}

export async function createClass(academyId, data) {
  const result = await query(
    `INSERT INTO classes (academy_id, name, batch, shift, room_number, max_capacity, monthly_fee, teacher_name)
     VALUES (:academyId, :name, :batch, :shift, :roomNumber, :maxCapacity, :monthlyFee, :teacherName)`,
    {
      academyId,
      name: data.name,
      batch: data.batch || null,
      shift: data.shift || "Evening",
      roomNumber: data.roomNumber || null,
      maxCapacity: data.maxCapacity || 40,
      monthlyFee: data.monthlyFee || 3500,
      teacherName: data.teacherName || null,
    }
  );

  return { id: result.insertId, ...data };
}

export async function updateClass(academyId, id, data) {
  await getClassById(academyId, id);

  const fields = [];
  const params = { id, academyId };

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      const dbCol = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      fields.push(`${dbCol} = :${key}`);
      params[key] = val;
    }
  }

  if (fields.length > 0) {
    await query(
      `UPDATE classes SET ${fields.join(", ")} WHERE id = :id AND academy_id = :academyId`,
      params
    );
  }

  return await getClassById(academyId, id);
}

export async function deleteClass(academyId, id) {
  await getClassById(academyId, id);
  await query("DELETE FROM classes WHERE id = :id AND academy_id = :academyId", {
    id,
    academyId,
  });
  return { message: "Class deleted successfully" };
}

export default {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
};
