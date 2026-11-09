-- ============================================================================
-- Seed Data for Tuition Academy Manager
-- Includes: Punjab Coaching Center, Admin User, Classes, Students, Fees, and Exams
-- ============================================================================

USE academy_manager;

-- 1. Insert Demo Academy
INSERT INTO academies (id, name, city, phone, address) 
VALUES (1, 'Punjab Coaching Center', 'Lahore', '0300-1234567', 'Gulberg III, Lahore, Pakistan')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert Admin User (Password is 'password123', bcrypt hash)
INSERT INTO users (id, academy_id, full_name, email, password_hash, phone, role)
VALUES (
  1,
  1,
  'Arqam Ishaq',
  'admin@academy.pk',
  '$2a$10$wK3T49yN4F5Z3fD5Q8t7beWvPvhJ9.fWqJdE7VshhW7qg7.8H9y6G',
  '0300-9876543',
  'admin'
)
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- 3. Insert Classes
INSERT INTO classes (id, academy_id, name, batch, shift, room_number, max_capacity, monthly_fee, teacher_name)
VALUES
  (1, 1, 'Class 9th (Matric Science)', 'Batch A', 'Evening', 'Room 101', 35, 3000.00, 'Sir Hamza'),
  (2, 1, 'Class 10th (Matric Science)', 'Batch B', 'Evening', 'Room 102', 35, 3500.00, 'Sir Usman'),
  (3, 1, 'F.Sc Part-1 (Pre-Medical)', 'Session 2026', 'Evening', 'Room 201', 40, 4500.00, 'Prof. Tariq'),
  (4, 1, 'F.Sc Part-2 (Pre-Engineering)', 'Session 2026', 'Evening', 'Room 202', 40, 5000.00, 'Prof. Bilal'),
  (5, 1, 'MDCAT / ECAT Crash Batch', 'Entry Test 2026', 'Morning', 'Hall A', 50, 6000.00, 'Dr. Salman')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Insert Demo Students with Pakistani Demographics
INSERT INTO students (id, academy_id, class_id, full_name, father_name, roll_number, phone, parent_phone, address, monthly_fee, fee_status, attendance_pct, admission_date)
VALUES
  (1, 1, 1, 'Muhammad Ali', 'Tariq Mehmood', '9M-01', '0301-1122334', '0300-1122334', 'Iqbal Town, Lahore', 3000.00, 'Paid', 94.00, '2026-08-01'),
  (2, 1, 1, 'Fatima Noor', 'Muhammad Asif', '9M-02', '0302-2233445', '0300-2233445', 'Model Town, Lahore', 3000.00, 'Paid', 91.00, '2026-08-01'),
  (3, 1, 1, 'Hamza Tariq', 'Tariq Hussain', '9M-03', '0303-3344556', '0300-3344556', 'Johar Town, Lahore', 3000.00, 'Pending', 82.00, '2026-08-05'),
  (4, 1, 2, 'Zainab Bibi', 'Abdul Rehman', '10M-01', '0304-4455667', '0300-4455667', 'Faisal Town, Lahore', 3500.00, 'Paid', 96.00, '2026-08-01'),
  (5, 1, 2, 'Bilal Ahmed', 'Ahmed Saeed', '10M-02', '0305-5566778', '0300-5566778', 'Wapda Town, Lahore', 3500.00, 'Overdue', 74.00, '2026-08-10'),
  (6, 1, 3, 'Ayesha Khan', 'Javed Khan', 'FSC1-01', '0306-6677889', '0300-6677889', 'DHA Phase 5, Lahore', 4500.00, 'Paid', 95.00, '2026-08-01'),
  (7, 1, 3, 'Usman Ghani', 'Muhammad Ghani', 'FSC1-02', '0307-7788990', '0300-7788990', 'Cavalry Ground, Lahore', 4500.00, 'Pending', 88.00, '2026-08-03'),
  (8, 1, 4, 'Hassan Raza', 'Raza Ali', 'FSC2-01', '0308-8899001', '0300-8899001', 'Gulberg II, Lahore', 5000.00, 'Paid', 92.00, '2026-08-01'),
  (9, 1, 5, 'Sara Malik', 'Malik Nadeem', 'CAT-01', '0309-9900112', '0300-9900112', 'Cantt, Lahore', 6000.00, 'Paid', 98.00, '2026-09-01')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- 5. Insert Sample November 2026 Invoices
INSERT INTO fee_invoices (id, academy_id, student_id, month, amount, paid_amount, status, payment_method, due_date, paid_at)
VALUES
  (1, 1, 1, 'November 2026', 3000.00, 3000.00, 'Paid', 'Cash', '2026-11-10', '2026-11-05 10:00:00'),
  (2, 1, 2, 'November 2026', 3000.00, 3000.00, 'Paid', 'JazzCash', '2026-11-10', '2026-11-06 14:30:00'),
  (3, 1, 3, 'November 2026', 3000.00, 0.00, 'Pending', NULL, '2026-11-10', NULL),
  (4, 1, 4, 'November 2026', 3500.00, 3500.00, 'Paid', 'Easypaisa', '2026-11-10', '2026-11-04 11:20:00'),
  (5, 1, 5, 'November 2026', 3500.00, 0.00, 'Overdue', NULL, '2026-11-05', NULL)
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- 6. Insert Sample Exam
INSERT INTO exams (id, academy_id, class_id, name, subject, date, total_marks, passing_marks, status)
VALUES
  (1, 1, 1, 'Monthly Assessment 1', 'Mathematics', '2026-11-15', 50, 20, 'Published'),
  (2, 1, 3, 'Pre-Board Mock Exam', 'Biology', '2026-11-20', 100, 40, 'Upcoming')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 7. Insert Sample Marks
INSERT INTO exam_marks (academy_id, exam_id, student_id, obtained_marks)
VALUES
  (1, 1, 1, 46.00),
  (1, 1, 2, 42.50),
  (1, 1, 3, 38.00)
ON DUPLICATE KEY UPDATE obtained_marks=VALUES(obtained_marks);
