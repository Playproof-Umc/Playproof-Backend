-- DropForeignKey
ALTER TABLE `azit_schedule` DROP FOREIGN KEY `azit_schedule_azit_id_fkey`;

-- DropForeignKey
ALTER TABLE `azit_schedule_participation` DROP FOREIGN KEY `azit_schedule_participation_member_id_fkey`;

-- DropForeignKey
ALTER TABLE `azit_schedule_participation` DROP FOREIGN KEY `azit_schedule_participation_schedule_id_fkey`;

-- DropForeignKey
ALTER TABLE `azit_user` DROP FOREIGN KEY `azit_user_azit_id_fkey`;

-- DropForeignKey
ALTER TABLE `chat_medias` DROP FOREIGN KEY `chat_medias_chat_id_fkey`;

-- DropForeignKey
ALTER TABLE `chat_rooms` DROP FOREIGN KEY `chat_rooms_azit_id_fkey`;

-- DropForeignKey
ALTER TABLE `chats` DROP FOREIGN KEY `chats_chat_room_id_fkey`;

-- DropForeignKey
ALTER TABLE `chats` DROP FOREIGN KEY `chats_member_id_fkey`;

-- DropIndex
DROP INDEX `azit_schedule_azit_id_fkey` ON `azit_schedule`;

-- DropIndex
DROP INDEX `azit_schedule_participation_schedule_id_fkey` ON `azit_schedule_participation`;

-- DropIndex
DROP INDEX `azit_user_azit_id_fkey` ON `azit_user`;

-- DropIndex
DROP INDEX `chat_medias_chat_id_fkey` ON `chat_medias`;

-- DropIndex
DROP INDEX `chat_rooms_azit_id_fkey` ON `chat_rooms`;

-- DropIndex
DROP INDEX `chats_chat_room_id_fkey` ON `chats`;

-- DropIndex
DROP INDEX `chats_member_id_fkey` ON `chats`;

-- AddForeignKey
ALTER TABLE `azit_user` ADD CONSTRAINT `azit_user_azit_id_fkey` FOREIGN KEY (`azit_id`) REFERENCES `azits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `azit_schedule` ADD CONSTRAINT `azit_schedule_azit_id_fkey` FOREIGN KEY (`azit_id`) REFERENCES `azits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `azit_schedule_participation` ADD CONSTRAINT `azit_schedule_participation_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `azit_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `azit_schedule_participation` ADD CONSTRAINT `azit_schedule_participation_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `azit_schedule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_rooms` ADD CONSTRAINT `chat_rooms_azit_id_fkey` FOREIGN KEY (`azit_id`) REFERENCES `azits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chats` ADD CONSTRAINT `chats_chat_room_id_fkey` FOREIGN KEY (`chat_room_id`) REFERENCES `chat_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chats` ADD CONSTRAINT `chats_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `azit_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_medias` ADD CONSTRAINT `chat_medias_chat_id_fkey` FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
