-- CreateTable
CREATE TABLE `chat_room_member` (
    `member_id` BIGINT NOT NULL,
    `room_id` BIGINT NOT NULL,
    `role` ENUM('creator', 'participant') NOT NULL DEFAULT 'participant',
    `participation_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`member_id`, `room_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `chat_room_member` ADD CONSTRAINT `chat_room_member_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `azit_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_room_member` ADD CONSTRAINT `chat_room_member_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
