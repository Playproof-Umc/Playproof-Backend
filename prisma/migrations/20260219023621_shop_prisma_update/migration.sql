/*
  Warnings:

  - You are about to drop the column `is_participation` on the `azit_schedule_participation` table. All the data in the column will be lost.
  - You are about to drop the column `ts_score_change` on the `feedbacks` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `buy_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shopping_cart` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `user_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `applications` DROP FOREIGN KEY `applications_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `azit_user` DROP FOREIGN KEY `azit_user_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `bans` DROP FOREIGN KEY `bans_target_id_fkey`;

-- DropForeignKey
ALTER TABLE `bans` DROP FOREIGN KEY `bans_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `buy_items` DROP FOREIGN KEY `buy_items_item_id_fkey`;

-- DropForeignKey
ALTER TABLE `buy_items` DROP FOREIGN KEY `buy_items_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `community_comments` DROP FOREIGN KEY `community_comments_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `community_likes` DROP FOREIGN KEY `community_likes_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `community_posts` DROP FOREIGN KEY `community_posts_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `feedbacks` DROP FOREIGN KEY `feedbacks_target_id_fkey`;

-- DropForeignKey
ALTER TABLE `feedbacks` DROP FOREIGN KEY `feedbacks_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `friends` DROP FOREIGN KEY `friends_from_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `friends` DROP FOREIGN KEY `friends_to_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `highlights` DROP FOREIGN KEY `highlights_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `party_posts` DROP FOREIGN KEY `party_posts_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `post_comments` DROP FOREIGN KEY `post_comments_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `reports` DROP FOREIGN KEY `reports_target_id_fkey`;

-- DropForeignKey
ALTER TABLE `reports` DROP FOREIGN KEY `reports_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `shopping_cart` DROP FOREIGN KEY `shopping_cart_item_id_fkey`;

-- DropForeignKey
ALTER TABLE `shopping_cart` DROP FOREIGN KEY `shopping_cart_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_avatar` DROP FOREIGN KEY `user_avatar_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_category_info` DROP FOREIGN KEY `user_category_info_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_game_info` DROP FOREIGN KEY `user_game_info_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_post_like` DROP FOREIGN KEY `user_post_like_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_term` DROP FOREIGN KEY `user_term_user_id_fkey`;

-- DropIndex
DROP INDEX `applications_user_id_fkey` ON `applications`;

-- DropIndex
DROP INDEX `azit_user_user_id_fkey` ON `azit_user`;

-- DropIndex
DROP INDEX `bans_target_id_fkey` ON `bans`;

-- DropIndex
DROP INDEX `bans_user_id_fkey` ON `bans`;

-- DropIndex
DROP INDEX `community_comments_user_id_fkey` ON `community_comments`;

-- DropIndex
DROP INDEX `community_likes_user_id_fkey` ON `community_likes`;

-- DropIndex
DROP INDEX `community_posts_user_id_fkey` ON `community_posts`;

-- DropIndex
DROP INDEX `feedbacks_target_id_fkey` ON `feedbacks`;

-- DropIndex
DROP INDEX `feedbacks_user_id_fkey` ON `feedbacks`;

-- DropIndex
DROP INDEX `friends_from_user_id_fkey` ON `friends`;

-- DropIndex
DROP INDEX `friends_to_user_id_fkey` ON `friends`;

-- DropIndex
DROP INDEX `highlights_user_id_fkey` ON `highlights`;

-- DropIndex
DROP INDEX `party_posts_user_id_fkey` ON `party_posts`;

-- DropIndex
DROP INDEX `post_comments_user_id_fkey` ON `post_comments`;

-- DropIndex
DROP INDEX `reports_target_id_fkey` ON `reports`;

-- DropIndex
DROP INDEX `reports_user_id_fkey` ON `reports`;

-- DropIndex
DROP INDEX `user_game_info_user_id_fkey` ON `user_game_info`;

-- AlterTable
ALTER TABLE `azit_schedule_participation` DROP COLUMN `is_participation`;

-- AlterTable
ALTER TABLE `feedbacks` DROP COLUMN `ts_score_change`;

-- AlterTable
-- AlterTable (safe transition for primary key column)
-- 1) add new nullable column
ALTER TABLE `users` ADD COLUMN `user_id` BIGINT NULL;
-- 2) copy existing id values into new column
UPDATE `users` SET `user_id` = `id`;
-- 3) replace old `id` primary-key column with `user_id` in one atomic step
ALTER TABLE `users` DROP COLUMN `id`, MODIFY COLUMN `user_id` BIGINT NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (`user_id`);

-- DropTable
DROP TABLE `buy_items`;

-- DropTable
DROP TABLE `shopping_cart`;

-- CreateTable
CREATE TABLE `item_categories` (
    `category_id` BIGINT NOT NULL,
    `category_name` VARCHAR(191) NULL,
    `display_name` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,

    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items` (
    `item_id` BIGINT NOT NULL,
    `category_id` BIGINT NOT NULL,
    `item_name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` INTEGER NULL,
    `image_url` VARCHAR(191) NULL,
    `is_active` BOOLEAN NULL,
    `created_at` DATETIME(3) NULL,

    PRIMARY KEY (`item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_inventory` (
    `inventory_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `item_id` BIGINT NOT NULL,
    `is_equipped` BOOLEAN NULL,
    `acquired_at` DATETIME(3) NULL,

    PRIMARY KEY (`inventory_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_equipped_items` (
    `user_id` BIGINT NOT NULL,
    `category_id` BIGINT NOT NULL,
    `item_id` BIGINT NOT NULL,
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`user_id`, `category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart` (
    `cart_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `item_id` BIGINT NOT NULL,
    `quantity` INTEGER NULL,
    `created_at` DATETIME(3) NULL,
    `shopItemId` BIGINT NULL,

    PRIMARY KEY (`cart_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_term` ADD CONSTRAINT `user_term_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_avatar` ADD CONSTRAINT `user_avatar_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_game_info` ADD CONSTRAINT `user_game_info_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_category_info` ADD CONSTRAINT `user_category_info_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friends` ADD CONSTRAINT `friends_from_user_id_fkey` FOREIGN KEY (`from_user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friends` ADD CONSTRAINT `friends_to_user_id_fkey` FOREIGN KEY (`to_user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bans` ADD CONSTRAINT `bans_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bans` ADD CONSTRAINT `bans_target_id_fkey` FOREIGN KEY (`target_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_target_id_fkey` FOREIGN KEY (`target_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `items` ADD CONSTRAINT `items_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `item_categories`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_inventory` ADD CONSTRAINT `user_inventory_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_inventory` ADD CONSTRAINT `user_inventory_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_equipped_items` ADD CONSTRAINT `user_equipped_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_equipped_items` ADD CONSTRAINT `user_equipped_items_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `item_categories`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_equipped_items` ADD CONSTRAINT `user_equipped_items_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart` ADD CONSTRAINT `cart_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart` ADD CONSTRAINT `cart_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart` ADD CONSTRAINT `cart_shopItemId_fkey` FOREIGN KEY (`shopItemId`) REFERENCES `shop_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `party_posts` ADD CONSTRAINT `party_posts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_comments` ADD CONSTRAINT `post_comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_post_like` ADD CONSTRAINT `user_post_like_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `azit_user` ADD CONSTRAINT `azit_user_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `highlights` ADD CONSTRAINT `highlights_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_posts` ADD CONSTRAINT `community_posts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_comments` ADD CONSTRAINT `community_comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_likes` ADD CONSTRAINT `community_likes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_target_id_fkey` FOREIGN KEY (`target_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
