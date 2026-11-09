-- ============================================================================
-- Tuition Academy Manager SaaS Database Schema (MySQL 8)
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS academy_manager 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE academy_manager;

-- 1. Academies Table (Multi-tenant partition)
CREATE TABLE IF NOT EXISTS academies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  city VARCHAR(80) NOT NULL DEFAULT 'Lahore',
  phone VARCHAR(25) NULL,
  address VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Users Table (Authentication & RBAC)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academy_id INT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(25) NULL,
  role ENUM('admin', 'teacher', 'staff', 'student', 'parent') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Classes & Batches Table
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academy_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  batch VARCHAR(50) NULL,
  shift ENUM('Morning', 'Evening', 'Afternoon') NOT NULL DEFAULT 'Evening',
  room_number VARCHAR(25) NULL,
  max_capacity INT NOT NULL DEFAULT 40,
  monthly_fee DECIMAL(10, 2) NOT NULL DEFAULT 3500.00,
  teacher_name VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Students Table
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academy_id INT NOT NULL,
  class_id INT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  father_name VARCHAR(100) NOT NULL,
  roll_number VARCHAR(30) NOT NULL,
  phone VARCHAR(25) NOT NULL,
  parent_phone VARCHAR(25) NOT NULL,
  address VARCHAR(255) NULL,
  monthly_fee DECIMAL(10, 2) NOT NULL DEFAULT 3500.00,
  fee_status ENUM('Paid', 'Pending', 'Overdue') NOT NULL DEFAULT 'Pending',
  attendance_pct DECIMAL(5, 2) NOT NULL DEFAULT 85.00,
  admission_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_academy_student_roll (academy_id, roll_number),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 5. Daily Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academy_id INT NOT NULL,
  class_id INT NOT NULL,
  student_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('Present', 'Absent', 'Late', 'Leave') NOT NULL DEFAULT 'Present',
  remarks VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attendance_entry (academy_id, class_id, student_id, date),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Fee Invoices Table
CREATE TABLE IF NOT EXISTS fee_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academy_id INT NOT NULL,
  student_id INT NOT NULL,
  month VARCHAR(30) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status ENUM('Paid', 'Pending', 'Overdue', 'Partial') NOT NULL DEFAULT 'Pending',
  payment_method VARCHAR(50) NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invoice_student_month (academy_id, student_id, month),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Fee Payments Transactions Ledger
CREATE TABLE IF NOT EXISTS fee_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academy_id INT NOT NULL,
  invoice_id INT NOT NULL,
  student_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
  note VARCHAR(255) NULL,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES fee_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Exams Table
CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academy_id INT NOT NULL,
  class_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(60) NOT NULL,
  date DATE NOT NULL,
  total_marks INT NOT NULL DEFAULT 100,
  passing_marks INT NOT NULL DEFAULT 40,
  status ENUM('Upcoming', 'Marks pending', 'Published') NOT NULL DEFAULT 'Upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Exam Marks Table
CREATE TABLE IF NOT EXISTS exam_marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academy_id INT NOT NULL,
  exam_id INT NOT NULL,
  student_id INT NOT NULL,
  obtained_marks DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_exam_mark (academy_id, exam_id, student_id),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;
