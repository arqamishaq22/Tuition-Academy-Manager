-- ============================================================================
-- Tuition Academy Manager SaaS Database Seed Script
-- Target: MySQL 8.0+
-- Academy: "Bright Future Academy", Lahore
-- Owner: owner@demo.com / Demo@1234 (Bcrypt Hash: $2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa)
-- ============================================================================

USE academy_manager;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. ACADEMY
-- ----------------------------------------------------------------------------
INSERT INTO academies (
  id, name, slug, address, city, phone, email, logo_url, plan, fee_due_day, late_fee_enabled, late_fee_amount, reminder_template, is_active
) VALUES (
  1,
  'Bright Future Academy',
  'bright-future-academy',
  'Main Boulevard, Gulberg III, Lahore, Pakistan',
  'Lahore',
  '0300-5551234',
  'contact@brightfuture.edu.pk',
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&h=200&fit=crop',
  'standard',
  10,
  TRUE,
  200,
  'Assalam o Alaikum! This is a reminder from Bright Future Academy. Fee of Rs. {amount} for {student_name} is due by {due_date}. Please submit at the front desk or via JazzCash/Easypaisa.',
  TRUE
) ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ----------------------------------------------------------------------------
-- 2. USERS (Owner + 3 Teachers + 10 Parents)
-- ----------------------------------------------------------------------------
-- Verified Bcrypt Hash for password "Demo@1234":
-- $2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa

INSERT INTO users (
  id, academy_id, name, email, phone, password_hash, role, avatar_url, is_active, last_login_at
) VALUES 
  -- 1. Academy Owner
  (1, 1, 'Arqam Ishaq', 'owner@demo.com', '0300-5551234', '$2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa', 'owner', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', TRUE, NOW()),
  
  -- 2. Teachers (User accounts)
  (2, 1, 'Sir Hamza Tariq', 'hamza@brightfuture.edu.pk', '0301-5550001', '$2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa', 'teacher', NULL, TRUE, NOW()),
  (3, 1, 'Sir Usman Ghani', 'usman@brightfuture.edu.pk', '0302-5550002', '$2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa', 'teacher', NULL, TRUE, NOW()),
  (4, 1, 'Madam Ayesha Khan', 'ayesha@brightfuture.edu.pk', '0303-5550003', '$2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa', 'teacher', NULL, TRUE, NOW()),
  
  -- 3. Parent User Accounts (10 Parents)
  (101, 1, 'Tariq Mehmood', 'parent.tariq@demo.com', '0300-1110001', '$2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa', 'parent', NULL, TRUE, NOW()),
  (102, 1, 'Muhammad Asif', 'parent.asif@demo.com', '0300-1110002', '$2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa', 'parent', NULL, TRUE, NOW()),
  (103, 1, 'Abdul Rehman', 'parent.rehman@demo.com', '0300-1110003', '$2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa', 'parent', NULL, TRUE, NOW()),
  (104, 1, 'Ahmed Saeed', 'parent.saeed@demo.com', '0300-1110004', '$2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa', 'parent', NULL, TRUE, NOW()),
  (105, 1, 'Javed Iqbal Khan', 'parent.javed@demo.com', '0300-1110005', '$2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa', 'parent', NULL, TRUE, NOW()),
  (106, 1, 'Raza Ali', 'parent.raza@demo.com', '0300-1110006', '$2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa', 'parent', NULL, TRUE, NOW()),
  (107, 1, 'Malik Nadeem', 'parent.nadeem@demo.com', '0300-1110007', '$2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa', 'parent', NULL, TRUE, NOW()),
  (108, 1, 'Nawaz Sharif Butt', 'parent.nawaz@demo.com', '0300-1110008', '$2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa', 'parent', NULL, TRUE, NOW()),
  (109, 1, 'Farooq Azam', 'parent.farooq@demo.com', '0300-1110009', '$2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa', 'parent', NULL, TRUE, NOW()),
  (110, 1, 'Zeeshan Sheikh', 'parent.zeeshan@demo.com', '0300-1110010', '$2a$10$.q5.HFrK5yqM/Lr0U6NLL.R..6U7TDOKf5CzIrAw7S.2y.RLFRkFa', 'parent', NULL, TRUE, NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ----------------------------------------------------------------------------
-- 3. TEACHERS DIRECTORY
-- ----------------------------------------------------------------------------
INSERT INTO teachers (
  id, academy_id, user_id, name, phone, email, qualification, subject, salary, joined_on, is_active
) VALUES
  (1, 1, 2, 'Sir Hamza Tariq', '0301-5550001', 'hamza@brightfuture.edu.pk', 'M.Sc Mathematics (PU)', 'Mathematics', 45000, '2025-01-10', TRUE),
  (2, 1, 3, 'Sir Usman Ghani', '0302-5550002', 'usman@brightfuture.edu.pk', 'M.Sc Physics (GCU)', 'Physics & Science', 50000, '2025-02-01', TRUE),
  (3, 1, 4, 'Madam Ayesha Khan', '0303-5550003', 'ayesha@brightfuture.edu.pk', 'M.Phil Chemistry (FCCU)', 'Chemistry & English', 48000, '2025-03-15', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ----------------------------------------------------------------------------
-- 4. CLASSES (Class 6 to Class 10)
-- ----------------------------------------------------------------------------
INSERT INTO classes (
  id, academy_id, name, section, timing_start, timing_end, days_of_week, monthly_fee, teacher_id, capacity, is_active
) VALUES
  (1, 1, 'Class 6', 'Section A', '15:00:00', '17:00:00', 'Mon,Tue,Wed,Thu,Fri,Sat', 2500, 1, 30, TRUE),
  (2, 1, 'Class 7', 'Section A', '15:00:00', '17:00:00', 'Mon,Tue,Wed,Thu,Fri,Sat', 2800, 1, 30, TRUE),
  (3, 1, 'Class 8', 'Section A', '16:00:00', '18:30:00', 'Mon,Tue,Wed,Thu,Fri,Sat', 3000, 2, 35, TRUE),
  (4, 1, 'Class 9', 'Science Batch A', '16:30:00', '19:30:00', 'Mon,Tue,Wed,Thu,Fri,Sat', 3500, 2, 40, TRUE),
  (5, 1, 'Class 10', 'Science Batch B', '17:00:00', '20:00:00', 'Mon,Tue,Wed,Thu,Fri,Sat', 4000, 3, 40, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ----------------------------------------------------------------------------
-- 5. SUBJECTS & CLASS_SUBJECTS
-- ----------------------------------------------------------------------------
INSERT INTO subjects (id, academy_id, name) VALUES
  (1, 1, 'Mathematics'),
  (2, 1, 'English'),
  (3, 1, 'Urdu'),
  (4, 1, 'General Science'),
  (5, 1, 'Physics'),
  (6, 1, 'Chemistry')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Allocate subjects to classes
INSERT INTO class_subjects (class_id, subject_id, teacher_id) VALUES
  -- Class 6 & 7
  (1, 1, 1), (1, 2, 3), (1, 3, 3), (1, 4, 2),
  (2, 1, 1), (2, 2, 3), (2, 3, 3), (2, 4, 2),
  -- Class 8
  (3, 1, 1), (3, 2, 3), (3, 3, 3), (3, 4, 2),
  -- Class 9 & 10 (Board science subjects)
  (4, 1, 1), (4, 2, 3), (4, 5, 2), (4, 6, 3),
  (5, 1, 1), (5, 2, 3), (5, 5, 2), (5, 6, 3)
ON DUPLICATE KEY UPDATE teacher_id=VALUES(teacher_id);

-- ----------------------------------------------------------------------------
-- 6. STUDENTS (40 Pakistani Students across 5 Classes, 8 per Class)
-- ----------------------------------------------------------------------------
INSERT INTO students (
  id, academy_id, class_id, roll_no, name, father_name, gender, date_of_birth, phone, parent_phone, address, monthly_fee, discount, photo_url, admission_date, status
) VALUES
  -- Class 6 (id 1 to 8)
  (1,  1, 1, 'C6-01', 'Muhammad Ali', 'Tariq Mehmood', 'male', '2014-04-12', '0301-1122001', '0300-1110001', 'Iqbal Town, Lahore', 2500, 0, NULL, '2026-08-01', 'active'),
  (2,  1, 1, 'C6-02', 'Fatima Noor', 'Muhammad Asif', 'female', '2014-06-25', '0301-1122002', '0300-1110002', 'Model Town, Lahore', 2500, 0, NULL, '2026-08-01', 'active'),
  (3,  1, 1, 'C6-03', 'Hamza Tariq', 'Tariq Mehmood', 'male', '2014-01-15', '0301-1122003', '0300-1110001', 'Iqbal Town, Lahore', 2500, 500, NULL, '2026-08-01', 'active'),
  (4,  1, 1, 'C6-04', 'Zainab Bibi', 'Abdul Rehman', 'female', '2014-08-19', '0301-1122004', '0300-1110003', 'Faisal Town, Lahore', 2500, 0, NULL, '2026-08-01', 'active'),
  (5,  1, 1, 'C6-05', 'Bilal Ahmed', 'Ahmed Saeed', 'male', '2014-03-30', '0301-1122005', '0300-1110004', 'Wapda Town, Lahore', 2500, 0, NULL, '2026-08-01', 'active'),
  (6,  1, 1, 'C6-06', 'Ayesha Khan', 'Javed Iqbal Khan', 'female', '2014-09-08', '0301-1122006', '0300-1110005', 'DHA Phase 4, Lahore', 2500, 0, NULL, '2026-08-05', 'active'),
  (7,  1, 1, 'C6-07', 'Usman Ghani', 'Muhammad Asif', 'male', '2014-11-02', '0301-1122007', '0300-1110002', 'Model Town, Lahore', 2500, 500, NULL, '2026-08-05', 'active'),
  (8,  1, 1, 'C6-08', 'Hassan Raza', 'Raza Ali', 'male', '2014-05-18', '0301-1122008', '0300-1110006', 'Gulberg II, Lahore', 2500, 0, NULL, '2026-08-10', 'active'),

  -- Class 7 (id 9 to 16)
  (9,  1, 2, 'C7-01', 'Sara Malik', 'Malik Nadeem', 'female', '2013-02-14', '0301-1122009', '0300-1110007', 'Cantt, Lahore', 2800, 0, NULL, '2026-08-01', 'active'),
  (10, 1, 2, 'C7-02', 'Abdullah Butt', 'Nawaz Sharif Butt', 'male', '2013-07-22', '0301-1122010', '0300-1110008', 'Johar Town, Lahore', 2800, 0, NULL, '2026-08-01', 'active'),
  (11, 1, 2, 'C7-03', 'Maryam Nawaz', 'Nawaz Sharif Butt', 'female', '2013-10-10', '0301-1122011', '0300-1110008', 'Johar Town, Lahore', 2800, 300, NULL, '2026-08-01', 'active'),
  (12, 1, 2, 'C7-04', 'Omer Farooq', 'Farooq Azam', 'male', '2013-12-05', '0301-1122012', '0300-1110009', 'Township, Lahore', 2800, 0, NULL, '2026-08-01', 'active'),
  (13, 1, 2, 'C7-05', 'Khadija Tul Kubra', 'Zeeshan Sheikh', 'female', '2013-04-18', '0301-1122013', '0300-1110010', 'Garden Town, Lahore', 2800, 0, NULL, '2026-08-01', 'active'),
  (14, 1, 2, 'C7-06', 'Zeeshan Ali', 'Abdul Rehman', 'male', '2013-08-29', '0301-1122014', '0300-1110003', 'Faisal Town, Lahore', 2800, 0, NULL, '2026-08-05', 'active'),
  (15, 1, 2, 'C7-07', 'Hania Amir', 'Ahmed Saeed', 'female', '2013-03-12', '0301-1122015', '0300-1110004', 'Wapda Town, Lahore', 2800, 0, NULL, '2026-08-05', 'active'),
  (16, 1, 2, 'C7-08', 'Daniyal Sheikh', 'Zeeshan Sheikh', 'male', '2013-11-20', '0301-1122016', '0300-1110010', 'Garden Town, Lahore', 2800, 0, NULL, '2026-08-10', 'active'),

  -- Class 8 (id 17 to 24)
  (17, 1, 3, 'C8-01', 'Mahnoor Baloch', 'Malik Nadeem', 'female', '2012-01-28', '0301-1122017', '0300-1110007', 'Cantt, Lahore', 3000, 0, NULL, '2026-08-01', 'active'),
  (18, 1, 3, 'C8-02', 'Saad Rafiq', 'Raza Ali', 'male', '2012-05-14', '0301-1122018', '0300-1110006', 'Gulberg II, Lahore', 3000, 0, NULL, '2026-08-01', 'active'),
  (19, 1, 3, 'C8-03', 'Anaya Fatima', 'Farooq Azam', 'female', '2012-09-03', '0301-1122019', '0300-1110009', 'Township, Lahore', 3000, 0, NULL, '2026-08-01', 'active'),
  (20, 1, 3, 'C8-04', 'Haris Rauf', 'Tariq Mehmood', 'male', '2012-11-19', '0301-1122020', '0300-1110001', 'Iqbal Town, Lahore', 3000, 0, NULL, '2026-08-01', 'active'),
  (21, 1, 3, 'C8-05', 'Dua Zahra', 'Javed Iqbal Khan', 'female', '2012-03-08', '0301-1122021', '0300-1110005', 'DHA Phase 4, Lahore', 3000, 0, NULL, '2026-08-01', 'active'),
  (22, 1, 3, 'C8-06', 'Babar Azam', 'Muhammad Asif', 'male', '2012-10-15', '0301-1122022', '0300-1110002', 'Model Town, Lahore', 3000, 0, NULL, '2026-08-05', 'active'),
  (23, 1, 3, 'C8-07', 'Laiba Khan', 'Javed Iqbal Khan', 'female', '2012-07-27', '0301-1122023', '0300-1110005', 'DHA Phase 4, Lahore', 3000, 500, NULL, '2026-08-05', 'active'),
  (24, 1, 3, 'C8-08', 'Shaheen Afridi', 'Abdul Rehman', 'male', '2012-04-06', '0301-1122024', '0300-1110003', 'Faisal Town, Lahore', 3000, 0, NULL, '2026-08-10', 'active'),

  -- Class 9 (id 25 to 32)
  (25, 1, 4, 'C9-01', 'Iqra Aziz', 'Ahmed Saeed', 'female', '2011-06-17', '0301-1122025', '0300-1110004', 'Wapda Town, Lahore', 3500, 0, NULL, '2026-08-01', 'active'),
  (26, 1, 4, 'C9-02', 'Fahad Mustafa', 'Raza Ali', 'male', '2011-08-25', '0301-1122026', '0300-1110006', 'Gulberg II, Lahore', 3500, 0, NULL, '2026-08-01', 'active'),
  (27, 1, 4, 'C9-03', 'Aima Baig', 'Nawaz Sharif Butt', 'female', '2011-03-10', '0301-1122027', '0300-1110008', 'Johar Town, Lahore', 3500, 0, NULL, '2026-08-01', 'active'),
  (28, 1, 4, 'C9-04', 'Farhan Saeed', 'Farooq Azam', 'male', '2011-12-02', '0301-1122028', '0300-1110009', 'Township, Lahore', 3500, 0, NULL, '2026-08-01', 'active'),
  (29, 1, 4, 'C9-05', 'Sana Javed', 'Malik Nadeem', 'female', '2011-02-20', '0301-1122029', '0300-1110007', 'Cantt, Lahore', 3500, 0, NULL, '2026-08-01', 'active'),
  (30, 1, 4, 'C9-06', 'Wahab Riaz', 'Zeeshan Sheikh', 'male', '2011-05-19', '0301-1122030', '0300-1110010', 'Garden Town, Lahore', 3500, 0, NULL, '2026-08-05', 'active'),
  (31, 1, 4, 'C9-07', 'Kinza Hashmi', 'Abdul Rehman', 'female', '2011-09-14', '0301-1122031', '0300-1110003', 'Faisal Town, Lahore', 3500, 0, NULL, '2026-08-05', 'active'),
  (32, 1, 4, 'C9-08', 'Naseem Shah', 'Tariq Mehmood', 'male', '2011-01-31', '0301-1122032', '0300-1110001', 'Iqbal Town, Lahore', 3500, 0, NULL, '2026-08-10', 'active'),

  -- Class 10 (id 33 to 40)
  (33, 1, 5, 'C10-01', 'Alizeh Shah', 'Muhammad Asif', 'female', '2010-08-09', '0301-1122033', '0300-1110002', 'Model Town, Lahore', 4000, 0, NULL, '2026-08-01', 'active'),
  (34, 1, 5, 'C10-02', 'Asim Azhar', 'Ahmed Saeed', 'male', '2010-10-29', '0301-1122034', '0300-1110004', 'Wapda Town, Lahore', 4000, 0, NULL, '2026-08-01', 'active'),
  (35, 1, 5, 'C10-03', 'Maya Ali', 'Javed Iqbal Khan', 'female', '2010-04-16', '0301-1122035', '0300-1110005', 'DHA Phase 4, Lahore', 4000, 0, NULL, '2026-08-01', 'active'),
  (36, 1, 5, 'C10-04', 'Shadab Khan', 'Raza Ali', 'male', '2010-11-04', '0301-1122036', '0300-1110006', 'Gulberg II, Lahore', 4000, 0, NULL, '2026-08-01', 'active'),
  (37, 1, 5, 'C10-05', 'Yumna Zaidi', 'Nawaz Sharif Butt', 'female', '2010-07-30', '0301-1122037', '0300-1110008', 'Johar Town, Lahore', 4000, 0, NULL, '2026-08-01', 'active'),
  (38, 1, 5, 'C10-06', 'Feroze Khan', 'Farooq Azam', 'male', '2010-02-11', '0301-1122038', '0300-1110009', 'Township, Lahore', 4000, 0, NULL, '2026-08-05', 'active'),
  (39, 1, 5, 'C10-07', 'Sajal Aly', 'Zeeshan Sheikh', 'female', '2010-01-15', '0301-1122039', '0300-1110010', 'Garden Town, Lahore', 4000, 0, NULL, '2026-08-05', 'active'),
  (40, 1, 5, 'C10-08', 'Imran Abbas', 'Malik Nadeem', 'male', '2010-09-21', '0301-1122040', '0300-1110007', 'Cantt, Lahore', 4000, 500, NULL, '2026-08-10', 'active')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ----------------------------------------------------------------------------
-- 7. PARENT_STUDENTS (Linking Parents to Children)
-- ----------------------------------------------------------------------------
INSERT INTO parent_students (parent_user_id, student_id) VALUES
  (101, 1), (101, 3), (101, 20), (101, 32), -- Tariq Mehmood (4 kids across batches)
  (102, 2), (102, 7), (102, 22), (102, 33), -- Muhammad Asif
  (103, 4), (103, 14), (103, 24), (103, 31), -- Abdul Rehman
  (104, 5), (104, 15), (104, 25), (104, 34), -- Ahmed Saeed
  (105, 6), (105, 21), (105, 23), (105, 35), -- Javed Iqbal Khan
  (106, 8), (106, 18), (106, 26), (106, 36), -- Raza Ali
  (107, 9), (107, 17), (107, 29), (107, 40), -- Malik Nadeem
  (108, 10), (108, 11), (108, 27), (108, 37), -- Nawaz Sharif Butt
  (109, 12), (109, 19), (109, 28), (109, 38), -- Farooq Azam
  (110, 13), (110, 16), (110, 30), (110, 39)  -- Zeeshan Sheikh
ON DUPLICATE KEY UPDATE parent_user_id=VALUES(parent_user_id);

-- ----------------------------------------------------------------------------
-- 8. ATTENDANCE (30 Working Days of Attendance for all 40 Students)
-- Oct 1, 2026 to Nov 6, 2026 (Excluding Sundays)
-- ----------------------------------------------------------------------------
-- We insert a procedural block to seed 30 days of attendance
DROP PROCEDURE IF EXISTS seed_attendance;
DELIMITER //
CREATE PROCEDURE seed_attendance()
BEGIN
  DECLARE cur_day INT DEFAULT 0;
  DECLARE cur_date DATE DEFAULT '2026-10-01';
  DECLARE std_id INT DEFAULT 1;
  DECLARE s_status VARCHAR(10);
  DECLARE rnd INT;
  DECLARE c_id INT;

  WHILE cur_day < 35 DO
    -- Skip Sundays (DAYOFWEEK 1 = Sunday)
    IF DAYOFWEEK(cur_date) != 1 THEN
      SET std_id = 1;
      WHILE std_id <= 40 DO
        -- Determine class_id based on student
        IF std_id <= 8 THEN SET c_id = 1;
        ELSEIF std_id <= 16 THEN SET c_id = 2;
        ELSEIF std_id <= 24 THEN SET c_id = 3;
        ELSEIF std_id <= 32 THEN SET c_id = 4;
        ELSE SET c_id = 5;
        END IF;

        -- Generate realistic attendance distribution (~88% Present, 6% Absent, 4% Late, 2% Leave)
        SET rnd = FLOOR(RAND() * 100);
        IF rnd < 88 THEN
          SET s_status = 'present';
        ELSEIF rnd < 94 THEN
          SET s_status = 'absent';
        ELSEIF rnd < 98 THEN
          SET s_status = 'late';
        ELSE
          SET s_status = 'leave';
        END IF;

        INSERT INTO attendance (academy_id, student_id, class_id, date, status, note, marked_by)
        VALUES (1, std_id, c_id, cur_date, s_status, NULL, 1)
        ON DUPLICATE KEY UPDATE status=VALUES(status);

        SET std_id = std_id + 1;
      END WHILE;
    END IF;

    SET cur_date = DATE_ADD(cur_date, INTERVAL 1 DAY);
    SET cur_day = cur_day + 1;
  END WHILE;
END //
DELIMITER ;

CALL seed_attendance();
DROP PROCEDURE IF EXISTS seed_attendance;

-- ----------------------------------------------------------------------------
-- 9. FEES (Last 3 Months: Sep, Oct, Nov 2026) & PAYMENTS
-- ----------------------------------------------------------------------------
-- Month 9: September 2026 (All 40 Students - Fully Paid)
INSERT INTO fees (academy_id, student_id, month, year, amount, paid_amount, due_date, status, late_fee)
SELECT 
  1, 
  id, 
  9, 
  2026, 
  (monthly_fee - discount), 
  (monthly_fee - discount), 
  '2026-09-10', 
  'paid', 
  0
FROM students WHERE academy_id = 1
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- Month 10: October 2026 (Mix of Paid and Partial)
INSERT INTO fees (academy_id, student_id, month, year, amount, paid_amount, due_date, status, late_fee)
SELECT 
  1, 
  id, 
  10, 
  2026, 
  (monthly_fee - discount), 
  CASE 
    WHEN id % 5 = 0 THEN (monthly_fee - discount) - 1000 -- Partial
    ELSE (monthly_fee - discount)                         -- Paid
  END, 
  '2026-10-10', 
  CASE 
    WHEN id % 5 = 0 THEN 'partial'
    ELSE 'paid'
  END, 
  0
FROM students WHERE academy_id = 1
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- Month 11: November 2026 (Current Month: Mix of Paid, Partial, Pending, Overdue)
INSERT INTO fees (academy_id, student_id, month, year, amount, paid_amount, due_date, status, late_fee)
SELECT 
  1, 
  id, 
  11, 
  2026, 
  (monthly_fee - discount), 
  CASE 
    WHEN id % 4 = 1 THEN (monthly_fee - discount)        -- Paid
    WHEN id % 4 = 2 THEN (monthly_fee - discount) - 1000 -- Partial
    ELSE 0                                               -- Pending or Overdue
  END, 
  '2026-11-10', 
  CASE 
    WHEN id % 4 = 1 THEN 'paid'
    WHEN id % 4 = 2 THEN 'partial'
    WHEN id % 4 = 3 THEN 'pending'
    ELSE 'overdue'
  END, 
  CASE 
    WHEN id % 4 = 0 THEN 200 -- Late fee on overdue
    ELSE 0
  END
FROM students WHERE academy_id = 1
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- ----------------------------------------------------------------------------
-- 10. PAYMENTS LEDGER (Matching Payments for September, October, and November)
-- ----------------------------------------------------------------------------
-- Payments for September (Month 9)
INSERT INTO payments (academy_id, fee_id, student_id, receipt_no, amount, method, paid_on, note, received_by)
SELECT 
  1, 
  f.id, 
  f.student_id, 
  CONCAT('BFA-2609-', LPAD(f.student_id, 3, '0')), 
  f.paid_amount, 
  CASE 
    WHEN f.student_id % 3 = 0 THEN 'jazzcash'
    WHEN f.student_id % 3 = 1 THEN 'cash'
    ELSE 'easypaisa'
  END,
  '2026-09-08', 
  'Full tuition fee payment for September 2026',
  1
FROM fees f 
WHERE f.month = 9 AND f.year = 2026 AND f.paid_amount > 0
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- Payments for October (Month 10)
INSERT INTO payments (academy_id, fee_id, student_id, receipt_no, amount, method, paid_on, note, received_by)
SELECT 
  1, 
  f.id, 
  f.student_id, 
  CONCAT('BFA-2610-', LPAD(f.student_id, 3, '0')), 
  f.paid_amount, 
  CASE 
    WHEN f.student_id % 2 = 0 THEN 'cash'
    ELSE 'bank_transfer'
  END,
  '2026-10-07', 
  'Tuition payment for October 2026',
  1
FROM fees f 
WHERE f.month = 10 AND f.year = 2026 AND f.paid_amount > 0
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- Payments for November (Month 11 - Partial & Paid)
INSERT INTO payments (academy_id, fee_id, student_id, receipt_no, amount, method, paid_on, note, received_by)
SELECT 
  1, 
  f.id, 
  f.student_id, 
  CONCAT('BFA-2611-', LPAD(f.student_id, 3, '0')), 
  f.paid_amount, 
  'cash', 
  '2026-11-04', 
  'Advance fee receipt for November 2026',
  1
FROM fees f 
WHERE f.month = 11 AND f.year = 2026 AND f.paid_amount > 0
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- ----------------------------------------------------------------------------
-- 11. EXAMS & EXAM SUBJECTS
-- ----------------------------------------------------------------------------
INSERT INTO exams (id, academy_id, class_id, name, exam_type, start_date, session_label, status) VALUES
  (1, 1, 4, 'Monthly Assessment 1 (October)', 'monthly', '2026-10-20', '2026-27', 'published'),
  (2, 1, 4, 'Mid-Term Examination 2026', 'mid_term', '2026-11-25', '2026-27', 'upcoming')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO exam_subjects (id, exam_id, subject_id, total_marks, passing_marks) VALUES
  (1, 1, 1, 50, 20), -- Math (50 max)
  (2, 1, 5, 50, 20), -- Physics (50 max)
  (3, 2, 1, 100, 40), -- Math Midterm
  (4, 2, 5, 100, 40)  -- Physics Midterm
ON DUPLICATE KEY UPDATE total_marks=VALUES(total_marks);

-- ----------------------------------------------------------------------------
-- 12. EXAM MARKS (For Class 9 Students: ID 25 to 32)
-- ----------------------------------------------------------------------------
INSERT INTO marks (academy_id, exam_subject_id, student_id, marks_obtained) VALUES
  -- Mathematics Exam 1
  (1, 1, 25, 48.50),
  (1, 1, 26, 42.00),
  (1, 1, 27, 39.00),
  (1, 1, 28, 45.50),
  (1, 1, 29, 36.00),
  (1, 1, 30, 41.00),
  (1, 1, 31, 47.00),
  (1, 1, 32, 44.00),
  -- Physics Exam 1
  (1, 2, 25, 46.00),
  (1, 2, 26, 44.50),
  (1, 2, 27, 41.00),
  (1, 2, 28, 43.00),
  (1, 2, 29, 38.50),
  (1, 2, 30, 40.00),
  (1, 2, 31, 49.00),
  (1, 2, 32, 42.50)
ON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained);

-- ----------------------------------------------------------------------------
-- 13. NOTICES & READ RECEIPTS
-- ----------------------------------------------------------------------------
INSERT INTO notices (id, academy_id, title, body, audience, class_id, created_by, is_pinned) VALUES
  (
    1, 
    1, 
    'Winter Academy Timings Effective Nov 15', 
    'Respected parents and students, starting Monday 15th November, evening batches will begin 30 minutes earlier due to early sunset. Please ensure timely arrival.', 
    'all', 
    NULL, 
    1, 
    TRUE
  ),
  (
    2, 
    1, 
    'Monthly Fee Submission Deadline (10th Nov)', 
    'Dear Parents, please clear the tuition fee for the month of November by 10th November to avoid late surcharge. Fee vouchers can be paid via Cash, JazzCash, or Easypaisa.', 
    'parents', 
    NULL, 
    1, 
    FALSE
  ),
  (
    3, 
    1, 
    'Faculty Progress Review Meeting', 
    'All teaching staff members are requested to attend the monthly syllabus progress review this Saturday at 08:30 PM in the Conference Room.', 
    'teachers', 
    NULL, 
    1, 
    FALSE
  )
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO notice_reads (notice_id, user_id, read_at) VALUES
  (1, 1, NOW()),
  (1, 2, NOW()),
  (1, 101, NOW()),
  (1, 102, NOW()),
  (2, 101, NOW()),
  (2, 103, NOW()),
  (3, 2, NOW()),
  (3, 3, NOW())
ON DUPLICATE KEY UPDATE read_at=VALUES(read_at);

-- ----------------------------------------------------------------------------
-- 14. REMINDER LOGS (WhatsApp & SMS Dispatches)
-- ----------------------------------------------------------------------------
INSERT INTO reminder_logs (academy_id, student_id, fee_id, channel, message, status, sent_at) VALUES
  (1, 3, 3, 'whatsapp', 'Assalam o Alaikum! Fee reminder for Hamza Tariq. Rs. 2,000 due by 10 Nov 2026. Bright Future Academy.', 'sent', NOW()),
  (1, 5, 5, 'whatsapp', 'Assalam o Alaikum! Overdue fee reminder for Bilal Ahmed. Please submit fee of Rs. 2,700 including late fee. Bright Future Academy.', 'sent', NOW()),
  (1, 8, 8, 'sms', 'Bright Future Academy: Attendance alert for Hassan Raza. Marked Absent today.', 'sent', NOW());

-- ----------------------------------------------------------------------------
-- 15. ACTIVITY LOGS (Audit Trail)
-- ----------------------------------------------------------------------------
INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta, created_at) VALUES
  (1, 1, 'ACADEMY_INITIALIZED', 'academy', 1, '{"name": "Bright Future Academy", "city": "Lahore"}', NOW()),
  (1, 1, 'BATCH_ATTENDANCE_MARKED', 'attendance', 1, '{"class": "Class 9", "date": "2026-11-06", "total": 8}', NOW()),
  (1, 1, 'FEE_VOUCHERS_GENERATED', 'fees', 11, '{"month": "November 2026", "invoices_count": 40}', NOW());

SET FOREIGN_KEY_CHECKS = 1;
