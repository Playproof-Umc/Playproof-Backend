/*
  Warnings:

  - You are about to drop the column `position_id` on the `party_posts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `party_posts` DROP FOREIGN KEY `party_posts_position_id_fkey`;

-- DropIndex
DROP INDEX `party_posts_position_id_fkey` ON `party_posts`;

-- AlterTable
ALTER TABLE `party_posts` DROP COLUMN `position_id`;

-- CreateTable
CREATE TABLE `post_position` (
    `post_id` BIGINT NOT NULL,
    `position_id` BIGINT NOT NULL,

    PRIMARY KEY (`post_id`, `position_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `post_position` ADD CONSTRAINT `post_position_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `party_posts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_position` ADD CONSTRAINT `post_position_position_id_fkey` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
