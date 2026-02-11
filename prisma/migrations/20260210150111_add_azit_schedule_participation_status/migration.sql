-- Recreated migration: add is_participation status column
ALTER TABLE `azit_schedule_participation`
  ADD COLUMN `is_participation` ENUM('pending','decline','cancelled','join') NOT NULL DEFAULT 'pending';
