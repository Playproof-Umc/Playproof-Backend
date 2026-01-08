/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nickname]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `image_url` to the `azits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `azits` ADD COLUMN `image_url` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `chats` MODIFY `content` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `community_comments` MODIFY `content` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `feedbacks` MODIFY `content` TEXT NULL;

-- AlterTable
ALTER TABLE `party_posts` MODIFY `memo` TEXT NULL;

-- AlterTable
ALTER TABLE `post_comments` MODIFY `content` TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_phone_key` ON `users`(`phone`);

-- CreateIndex
CREATE UNIQUE INDEX `users_nickname_key` ON `users`(`nickname`);
