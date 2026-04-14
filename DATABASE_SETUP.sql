-- ═══════════════════════════════════════════════════════════════
-- CCMS DATABASE - ESSENTIAL SETUP
-- Run these queries in MySQL Workbench
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Use your CCMS database
USE ccms;

-- ═══════════════════════════════════════════════════════════════
-- Step 2: Add essential columns to users table
-- ═══════════════════════════════════════════════════════════════

-- Phase 1: Basic Registration Fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS year VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Phase 2: Optional Profile Fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Timestamps
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ═══════════════════════════════════════════════════════════════
-- Step 3: Verify the updated schema
-- ═══════════════════════════════════════════════════════════════
DESC users;

-- ═══════════════════════════════════════════════════════════════
-- Step 4: Insert test users (WORKING CREDENTIALS)
-- ═══════════════════════════════════════════════════════════════

-- Password: "test123" (bcrypt hash)
-- Use these to login:
-- Email: student@example.com | Password: test123
-- Email: admin@example.com | Password: test123

TRUNCATE TABLE users;

INSERT INTO users (name, email, password, branch, year, role) VALUES
('Test Student', 'student@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcg36', 'Computer Science', '3rd Year', 'student'),
('Admin User', 'admin@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcg36', 'Computer Science', '4th Year', 'admin');

-- ═══════════════════════════════════════════════════════════════
-- Step 5: Verify users
-- ═══════════════════════════════════════════════════════════════

SELECT id, name, email, branch, year, role FROM users;

-- ═══════════════════════════════════════════════════════════════
-- Step 6: Setup clubs table with admin_id
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS admin_id INT;
ALTER TABLE clubs ADD CONSTRAINT IF NOT EXISTS fk_club_admin 
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════
-- Step 7: Create club_members table (OPTION 2: Members via user accounts)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS club_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  club_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('member', 'coordinator') DEFAULT 'member',
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'accepted',
  joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_club_user (club_id, user_id),
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_club_id (club_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- ═══════════════════════════════════════════════════════════════
-- Step 8: Create test club and add test members
-- ═══════════════════════════════════════════════════════════════

-- First, insert a test club with admin_id = 2 (admin@example.com)
DELETE FROM club_members WHERE club_id IN (SELECT id FROM clubs);
DELETE FROM clubs;

INSERT INTO clubs (name, description, admin_id) VALUES
('Web Development Club', 'Learn and build web applications together', 2);

-- Get the club_id from the insert
-- Assume it's 1. If you need to verify, run: SELECT * FROM clubs;

-- Add test members to the club
INSERT INTO club_members (club_id, user_id, role, status) VALUES
(1, 1, 'member', 'accepted'),  -- Test Student joins as member
(1, 2, 'coordinator', 'accepted');  -- Admin User is coordinator

-- ═══════════════════════════════════════════════════════════════
-- Step 9: Verify club_members table
-- ═══════════════════════════════════════════════════════════════

SELECT cm.id, cm.club_id, c.name as club_name, cm.user_id, u.name as user_name, 
       u.email, cm.role, cm.status, cm.joined_date
FROM club_members cm
JOIN clubs c ON c.id = cm.club_id
JOIN users u ON u.id = cm.user_id;

DESC club_members;
DESC clubs;

-- ═══════════════════════════════════════════════════════════════
-- Step 10: Create join_requests table (for tracking membership requests)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS join_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  club_id INT NOT NULL,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  roll_number VARCHAR(50) NOT NULL,
  year VARCHAR(20) NOT NULL,
  role ENUM('Coordinator', 'Member') NOT NULL,
  interest_goals TEXT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  UNIQUE KEY unique_request (club_id, user_id),
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_club_id (club_id)
);

-- ═══════════════════════════════════════════════════════════════
-- Step 11: Verify all tables
-- ═══════════════════════════════════════════════════════════════

DESC join_requests;
DESC users;
DESC clubs;
DESC club_members;

-- ═══════════════════════════════════════════════════════════════
-- Step 12: Create or update event registrations table
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS event_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  roll_number VARCHAR(50) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  event_location VARCHAR(255) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  year VARCHAR(20) NOT NULL,
  outcome_of_event TEXT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_event_user (event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_event_id (event_id),
  INDEX idx_user_id (user_id)
);

ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS user_id INT;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS event_name VARCHAR(255);
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS event_location VARCHAR(255);
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS branch VARCHAR(100);
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS year VARCHAR(20);
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS outcome_of_event TEXT;

DESC event_registrations;
