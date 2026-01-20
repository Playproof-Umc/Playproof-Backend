-- DropForeignKey
ALTER TABLE `community_comments` DROP FOREIGN KEY `community_comments_post_id_fkey`;

-- DropForeignKey
ALTER TABLE `community_likes` DROP FOREIGN KEY `community_likes_post_id_fkey`;

-- DropForeignKey
ALTER TABLE `community_medias` DROP FOREIGN KEY `community_medias_post_id_fkey`;

-- DropIndex
DROP INDEX `community_comments_post_id_fkey` ON `community_comments`;

-- DropIndex
DROP INDEX `community_likes_post_id_fkey` ON `community_likes`;

-- DropIndex
DROP INDEX `community_medias_post_id_fkey` ON `community_medias`;

-- AddForeignKey
ALTER TABLE `community_comments` ADD CONSTRAINT `community_comments_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_likes` ADD CONSTRAINT `community_likes_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_medias` ADD CONSTRAINT `community_medias_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
