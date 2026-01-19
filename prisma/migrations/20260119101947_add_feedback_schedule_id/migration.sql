/*
  Warnings:

  - Added the required column `schedule_id` to the `feedbacks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `feedbacks` ADD COLUMN `schedule_id` BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `azit_schedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
