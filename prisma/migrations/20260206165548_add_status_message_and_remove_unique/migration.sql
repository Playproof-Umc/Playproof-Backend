-- DropIndex
DROP INDEX `tiers_tier_name_key` ON `tiers`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `statusMessage` VARCHAR(191) NULL;
