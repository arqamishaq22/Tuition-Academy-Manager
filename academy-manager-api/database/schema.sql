-- ============================================================================
-- Tuition Academy Manager SaaS Database Schema
-- Dialect: MySQL 8.0+
-- Storage Engine: InnoDB
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci
-- Multi-Tenant Partitioning: academy_id on all operational tables
-- ============================================================================

CREATE DATABASE IF NOT EXISTS academy_manager
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE academy_manager;

-- Disable foreign key checks during cleanup to ensure clean drop execution
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- Drop Views if exist
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS v_class_attendance_summary;
DROP VIEW IF EXISTS v_monthly_fee_summary;

-- ----------------------------------------------------------------------------
-- Drop Tables in reverse dependency order
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS reminder_logs;
DROP TABLE IF EXISTS notice_reads;
DROP TABLE IF EXISTS notices;
DROP TABLE IF EXISTS report_remarks;
DROP TABLE IF EXISTS marks;
DROP TABLE IF EXISTS exam_subjects;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS fees;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS parent_students;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS class_subjects;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS academies;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

-- ============================================================================
-- 1. ACADEMIES (Root Multi-Tenant Table)
-- ============================================================================
CREATE TABLE academies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  address VARCHAR(255) NULL,
  city VARCHAR(80) NOT NULL DEFAULT 'Lahore',
  phone VARCHAR(25) NULL,
  email VARCHAR(150) NULL,
  logo_url VARCHAR(255) NULL,
  plan ENUM('free_pilot', 'standard', 'pro') NOT NULL DEFAULT 'free_pilot',
  fee_due_day TINYINT UNSIGNED NOT NULL DEFAULT 10,
  late_fee_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  late_fee_amount INT UNSIGNED NOT NULL DEFAULT 0,
  reminder_template TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_academies_slug (slug),
  INDEX idx_academies_city (city),
  INDEX idx_academies_plan (plan),
  INDEX idx_academies_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. USERS (Authentication & Role-Based Access Control)
-- ============================================================================
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(25) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner', 'teacher', 'staff', 'parent') NOT NULL DEFAULT 'owner',
  avatar_url VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  failed_login_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  reset_password_token_hash VARCHAR(255) NULL,
  reset_password_expires_at DATETIME NULL,
  last_login_at DATETIME NULL,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_academy_email (academy_id, email),
  INDEX idx_users_academy_id (academy_id),
  INDEX idx_users_role (role),
  INDEX idx_users_phone (phone),
  INDEX idx_users_is_active (is_active),
  INDEX idx_users_locked_until (locked_until),
  INDEX idx_users_reset_token (reset_password_token_hash),
  INDEX idx_users_deleted_at (deleted_at),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. REFRESH TOKENS (Session & JWT Security)
-- ============================================================================
CREATE TABLE refresh_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  user_agent VARCHAR(255) NULL,
  ip VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_refresh_tokens_user_id (user_id),
  INDEX idx_refresh_tokens_token_hash (token_hash),
  INDEX idx_refresh_tokens_expires_at (expires_at),
  INDEX idx_refresh_tokens_revoked_at (revoked_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. TEACHERS (Faculty Directory)
-- ============================================================================
CREATE TABLE teachers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(25) NOT NULL,
  email VARCHAR(150) NULL,
  qualification VARCHAR(100) NULL,
  subject VARCHAR(100) NULL,
  salary INT UNSIGNED NULL,
  joined_on DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_teachers_academy_id (academy_id),
  INDEX idx_teachers_user_id (user_id),
  INDEX idx_teachers_name (name),
  INDEX idx_teachers_phone (phone),
  INDEX idx_teachers_is_active (is_active),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. CLASSES (Classrooms, Batches & Schedules)
-- ============================================================================
CREATE TABLE classes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  section VARCHAR(30) NULL,
  timing_start TIME NOT NULL,
  timing_end TIME NOT NULL,
  days_of_week VARCHAR(50) NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat',
  monthly_fee INT UNSIGNED NOT NULL DEFAULT 3500,
  teacher_id BIGINT UNSIGNED NULL,
  capacity INT UNSIGNED NOT NULL DEFAULT 40,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_classes_academy_id (academy_id),
  INDEX idx_classes_teacher_id (teacher_id),
  INDEX idx_classes_name (name),
  INDEX idx_classes_is_active (is_active),
  INDEX idx_classes_deleted_at (deleted_at),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. SUBJECTS & CLASS_SUBJECTS
-- ============================================================================
CREATE TABLE subjects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_subjects_academy_name (academy_id, name),
  INDEX idx_subjects_academy_id (academy_id),
  INDEX idx_subjects_name (name),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE class_subjects (
  class_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  teacher_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (class_id, subject_id),
  INDEX idx_class_subjects_class_id (class_id),
  INDEX idx_class_subjects_subject_id (subject_id),
  INDEX idx_class_subjects_teacher_id (teacher_id),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. STUDENTS (Demographics & Admission Profile)
-- ============================================================================
CREATE TABLE students (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NOT NULL,
  roll_no VARCHAR(30) NOT NULL,
  name VARCHAR(100) NOT NULL,
  father_name VARCHAR(100) NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL DEFAULT 'male',
  date_of_birth DATE NULL,
  phone VARCHAR(25) NULL,
  parent_phone VARCHAR(25) NOT NULL,
  address VARCHAR(255) NULL,
  monthly_fee INT UNSIGNED NOT NULL,
  discount INT UNSIGNED NOT NULL DEFAULT 0,
  photo_url VARCHAR(255) NULL,
  admission_date DATE NOT NULL,
  status ENUM('active', 'inactive', 'left') NOT NULL DEFAULT 'active',
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_students_academy_roll (academy_id, roll_no),
  INDEX idx_students_academy_id (academy_id),
  INDEX idx_students_class_id (class_id),
  INDEX idx_students_roll_no (roll_no),
  INDEX idx_students_name (name),
  INDEX idx_students_parent_phone (parent_phone),
  INDEX idx_students_status (status),
  INDEX idx_students_deleted_at (deleted_at),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. PARENT_STUDENTS (Guardian Mappings)
-- ============================================================================
CREATE TABLE parent_students (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_user_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_parent_student_pair (parent_user_id, student_id),
  INDEX idx_parent_students_parent_user (parent_user_id),
  INDEX idx_parent_students_student (student_id),
  FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. ATTENDANCE (Daily Student Attendance)
-- ============================================================================
CREATE TABLE attendance (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late', 'leave') NOT NULL DEFAULT 'present',
  note VARCHAR(255) NULL,
  marked_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attendance_student_date (student_id, date),
  INDEX idx_attendance_academy_id (academy_id),
  INDEX idx_attendance_class_date (class_id, date),
  INDEX idx_attendance_student_id (student_id),
  INDEX idx_attendance_date (date),
  INDEX idx_attendance_status (status),
  INDEX idx_attendance_marked_by (marked_by),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. FEES (Monthly Invoices in PKR)
-- ============================================================================
CREATE TABLE fees (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  month TINYINT UNSIGNED NOT NULL,
  year SMALLINT UNSIGNED NOT NULL,
  amount INT UNSIGNED NOT NULL,
  paid_amount INT UNSIGNED NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status ENUM('pending', 'partial', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
  late_fee INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fees_student_month_year (student_id, month, year),
  INDEX idx_fees_academy_id (academy_id),
  INDEX idx_fees_student_id (student_id),
  INDEX idx_fees_status (status),
  INDEX idx_fees_due_date (due_date),
  INDEX idx_fees_period (year, month),
  INDEX idx_fees_academy_status (academy_id, status),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. PAYMENTS (Transactions & Receipts)
-- ============================================================================
CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_id BIGINT UNSIGNED NOT NULL,
  fee_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  receipt_no VARCHAR(50) NOT NULL,
  amount INT UNSIGNED NOT NULL,
  method ENUM('cash', 'jazzcash', 'easypaisa', 'bank_transfer') NOT NULL DEFAULT 'cash',
  paid_on DATE NOT NULL,
  note VARCHAR(255) NULL,
  received_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payments_academy_receipt (academy_id, receipt_no),
  INDEX idx_payments_academy_id (academy_id),
  INDEX idx_payments_fee_id (fee_id),
  INDEX idx_payments_student_id (student_id),
  INDEX idx_payments_paid_on (paid_on),
  INDEX idx_payments_method (method),
  INDEX idx_payments_received_by (received_by),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. EXAMS (Exam Sessions)
-- ============================================================================
CREATE TABLE exams (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  exam_type ENUM('monthly', 'mid_term', 'final_term', 'other') NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  session_label VARCHAR(30) NOT NULL DEFAULT '2026-27',
  status ENUM('upcoming', 'marks_pending', 'published') NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_exams_academy_id (academy_id),
  INDEX idx_exams_class_id (class_id),
  INDEX idx_exams_status (status),
  INDEX idx_exams_start_date (start_date),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 13. EXAM_SUBJECTS (Subject Allocations per Exam)
-- ============================================================================
CREATE TABLE exam_subjects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  exam_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  total_marks INT UNSIGNED NOT NULL DEFAULT 100,
  passing_marks INT UNSIGNED NOT NULL DEFAULT 40,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_exam_subject (exam_id, subject_id),
  INDEX idx_exam_subjects_exam_id (exam_id),
  INDEX idx_exam_subjects_subject_id (subject_id),
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 14. MARKS (Student Score Ledger)
-- ============================================================================
CREATE TABLE marks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_id BIGINT UNSIGNED NOT NULL,
  exam_subject_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  marks_obtained DECIMAL(5, 2) NULL DEFAULT NULL,
  is_absent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_marks_exam_subject_student (exam_subject_id, student_id),
  INDEX idx_marks_academy_id (academy_id),
  INDEX idx_marks_exam_subject_id (exam_subject_id),
  INDEX idx_marks_student_id (student_id),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_subject_id) REFERENCES exam_subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 14b. REPORT_REMARKS (Teacher Remarks on Exam Report Cards)
-- ============================================================================
CREATE TABLE report_remarks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_id BIGINT UNSIGNED NOT NULL,
  exam_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  remark TEXT NOT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_report_remarks_exam_student (exam_id, student_id),
  INDEX idx_report_remarks_academy_id (academy_id),
  INDEX idx_report_remarks_exam_id (exam_id),
  INDEX idx_report_remarks_student_id (student_id),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 15. NOTICES (Academy Announcements)
-- ============================================================================
CREATE TABLE notices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  audience ENUM('all', 'parents', 'teachers', 'class') NOT NULL DEFAULT 'all',
  class_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_notices_academy_id (academy_id),
  INDEX idx_notices_audience (audience),
  INDEX idx_notices_class_id (class_id),
  INDEX idx_notices_is_pinned (is_pinned),
  INDEX idx_notices_created_by (created_by),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 16. NOTICE_READS (Read Receipts)
-- ============================================================================
CREATE TABLE notice_reads (
  notice_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notice_id, user_id),
  INDEX idx_notice_reads_notice_id (notice_id),
  INDEX idx_notice_reads_user_id (user_id),
  FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 17. REMINDER_LOGS (WhatsApp / SMS / Email Dispatch Ledger)
-- ============================================================================
CREATE TABLE reminder_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  fee_id BIGINT UNSIGNED NULL,
  channel ENUM('whatsapp', 'sms', 'email') NOT NULL DEFAULT 'whatsapp',
  message TEXT NOT NULL,
  status ENUM('queued', 'sent', 'failed') NOT NULL DEFAULT 'sent',
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reminder_logs_academy_id (academy_id),
  INDEX idx_reminder_logs_student_id (student_id),
  INDEX idx_reminder_logs_fee_id (fee_id),
  INDEX idx_reminder_logs_channel (channel),
  INDEX idx_reminder_logs_status (status),
  INDEX idx_reminder_logs_sent_at (sent_at),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 18. ACTIVITY_LOGS (Audit Trail)
-- ============================================================================
CREATE TABLE activity_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  meta JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_logs_academy_id (academy_id),
  INDEX idx_activity_logs_user_id (user_id),
  INDEX idx_activity_logs_entity (entity, entity_id),
  INDEX idx_activity_logs_action (action),
  INDEX idx_activity_logs_created_at (created_at),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- USEFUL REPORTING VIEWS
-- ============================================================================

-- View 1: Monthly Fee Collection & Arrears Summary by Academy and Month
CREATE OR REPLACE VIEW v_monthly_fee_summary AS
SELECT
  f.academy_id,
  a.name AS academy_name,
  f.year,
  f.month,
  COUNT(f.id) AS total_invoices,
  COALESCE(SUM(f.amount), 0) AS total_billed_pkr,
  COALESCE(SUM(f.paid_amount), 0) AS total_collected_pkr,
  COALESCE(SUM(CASE WHEN f.status IN ('pending', 'partial', 'overdue') THEN (f.amount - f.paid_amount) ELSE 0 END), 0) AS total_pending_pkr,
  COALESCE(SUM(CASE WHEN f.status = 'overdue' THEN (f.amount - f.paid_amount) ELSE 0 END), 0) AS total_overdue_pkr,
  COALESCE(SUM(f.late_fee), 0) AS total_late_fees_pkr,
  ROUND(
    CASE 
      WHEN SUM(f.amount) > 0 THEN (SUM(f.paid_amount) / SUM(f.amount)) * 100 
      ELSE 0 
    END, 2
  ) AS collection_percentage
FROM fees f
JOIN academies a ON f.academy_id = a.id
GROUP BY f.academy_id, a.name, f.year, f.month;

-- View 2: Class Attendance Summary (Daily and Cumulative)
CREATE OR REPLACE VIEW v_class_attendance_summary AS
SELECT
  att.academy_id,
  att.class_id,
  c.name AS class_name,
  att.date,
  COUNT(att.id) AS total_students_marked,
  COALESCE(SUM(att.status = 'present'), 0) AS present_count,
  COALESCE(SUM(att.status = 'absent'), 0) AS absent_count,
  COALESCE(SUM(att.status = 'late'), 0) AS late_count,
  COALESCE(SUM(att.status = 'leave'), 0) AS leave_count,
  ROUND(
    CASE 
      WHEN COUNT(att.id) > 0 THEN (SUM(att.status = 'present') / COUNT(att.id)) * 100 
      ELSE 0 
    END, 2
  ) AS attendance_percentage
FROM attendance att
JOIN classes c ON att.class_id = c.id
GROUP BY att.academy_id, att.class_id, c.name, att.date;
