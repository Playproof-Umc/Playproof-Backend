/*
  Warnings:

  - Added the required column `max_participants` to the `azit_schedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `azit_schedule` ADD COLUMN `max_participants` INTEGER NOT NULL;
