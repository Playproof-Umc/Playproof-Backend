/*
  Warnings:

  - The primary key for the `applications` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `applications` table. All the data in the column will be lost.
  - The primary key for the `party_posts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `party_posts` table. All the data in the column will be lost.
  - You are about to alter the column `recruitment_status` on the `party_posts` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(8))` to `VarChar(191)`.
  - The primary key for the `post_comments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `post_comments` table. All the data in the column will be lost.
  - Added the required column `application_id` to the `applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `post_id` to the `party_posts` table without a default value. This is not possible if the table is not empty.
  - Made the column `tier_id` on table `party_posts` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `comment_id` to the `post_comments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `applications` DROP FOREIGN KEY `applications_post_id_fkey`;

-- DropForeignKey
ALTER TABLE `party_posts` DROP FOREIGN KEY `party_posts_tier_id_fkey`;

-- DropForeignKey
ALTER TABLE `post_category` DROP FOREIGN KEY `post_category_post_id_fkey`;

-- DropForeignKey
ALTER TABLE `post_comments` DROP FOREIGN KEY `post_comments_parent_id_fkey`;

-- DropForeignKey
ALTER TABLE `post_comments` DROP FOREIGN KEY `post_comments_post_id_fkey`;

-- DropForeignKey
ALTER TABLE `post_position` DROP FOREIGN KEY `post_position_post_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_post_like` DROP FOREIGN KEY `user_post_like_post_id_fkey`;

-- DropIndex
DROP INDEX `applications_post_id_fkey` ON `applications`;

-- DropIndex
DROP INDEX `party_posts_tier_id_fkey` ON `party_posts`;

-- DropIndex
DROP INDEX `post_comments_parent_id_fkey` ON `post_comments`;

-- DropIndex
DROP INDEX `post_comments_post_id_fkey` ON `post_comments`;

-- DropIndex
DROP INDEX `user_post_like_post_id_fkey` ON `user_post_like`;

-- AlterTable
ALTER TABLE `applications` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD COLUMN `application_id` BIGINT NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`application_id`);

-- AlterTable
ALTER TABLE `party_posts` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD COLUMN `post_id` BIGINT NOT NULL AUTO_INCREMENT,
    MODIFY `tier_id` BIGINT NOT NULL,
    MODIFY `memo` VARCHAR(191) NULL,
    ALTER COLUMN `recruitment_people` DROP DEFAULT,
    ALTER COLUMN `is_mic_use` DROP DEFAULT,
    MODIFY `recruitment_status` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`post_id`);

-- AlterTable
ALTER TABLE `post_comments` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD COLUMN `comment_id` BIGINT NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`comment_id`);

-- AddForeignKey
ALTER TABLE `party_posts` ADD CONSTRAINT `party_posts_tier_id_fkey` FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_position` ADD CONSTRAINT `post_position_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `party_posts`(`post_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_category` ADD CONSTRAINT `post_category_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `party_posts`(`post_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_comments` ADD CONSTRAINT `post_comments_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `party_posts`(`post_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_comments` ADD CONSTRAINT `post_comments_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `post_comments`(`comment_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_post_like` ADD CONSTRAINT `user_post_like_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `party_posts`(`post_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `party_posts`(`post_id`) ON DELETE CASCADE ON UPDATE CASCADE;
