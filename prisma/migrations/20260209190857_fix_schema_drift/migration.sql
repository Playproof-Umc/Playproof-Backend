/*
  Warnings:

  - A unique constraint covering the columns `[category_name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[game_name]` on the table `games` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[negative_category_name]` on the table `negative_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[position_name]` on the table `positions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[positive_category_name]` on the table `positive_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `shop_items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `terms` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `schedule_id` to the `feedbacks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `feedbacks` ADD COLUMN `schedule_id` BIGINT NOT NULL,
    ADD COLUMN `ts_score_change` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `user_game_info` ADD COLUMN `account_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `statusMessage` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `chat_room_member` (
    `member_id` BIGINT NOT NULL,
    `room_id` BIGINT NOT NULL,
    `role` ENUM('creator', 'participant') NOT NULL DEFAULT 'participant',
    `participation_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`member_id`, `room_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `categories_category_name_key` ON `categories`(`category_name`);

-- CreateIndex
CREATE UNIQUE INDEX `games_game_name_key` ON `games`(`game_name`);

-- CreateIndex
CREATE UNIQUE INDEX `negative_categories_negative_category_name_key` ON `negative_categories`(`negative_category_name`);

-- CreateIndex
CREATE UNIQUE INDEX `positions_position_name_key` ON `positions`(`position_name`);

-- CreateIndex
CREATE UNIQUE INDEX `positive_categories_positive_category_name_key` ON `positive_categories`(`positive_category_name`);

-- CreateIndex
CREATE UNIQUE INDEX `shop_items_name_key` ON `shop_items`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `terms_name_key` ON `terms`(`name`);

-- AddForeignKey
ALTER TABLE `chat_room_member` ADD CONSTRAINT `chat_room_member_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `azit_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_room_member` ADD CONSTRAINT `chat_room_member_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `azit_schedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
