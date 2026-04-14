-- ═══════════════════════════════════════════════════════════════
-- CCMS DATABASE - ADD JOIN REQUEST FIELDS
-- ═══════════════════════════════════════════════════════════════

USE ccms;

-- Add columns to capture user details when joining
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS branch VARCHAR(100);
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50);
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS year VARCHAR(20);
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS role ENUM('Coordinator', 'Member');
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS interest_goals TEXT;

-- Verify the updated schema
DESC join_requests;

-- Check existing records
SELECT * FROM join_requests;

-- Add columns required for the updated event registration form
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS event_name VARCHAR(255);
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS event_location VARCHAR(255);
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS outcome_of_event TEXT;

DESC event_registrations;

