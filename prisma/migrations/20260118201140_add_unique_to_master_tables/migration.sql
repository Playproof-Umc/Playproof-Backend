/*
  Warnings:

  - A unique constraint covering the columns `[category_name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[game_name]` on the table `games` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[negative_category_name]` on the table `negative_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[position_name]` on the table `positions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[positive_category_name]` on the table `positive_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `shop_items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `terms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tier_name]` on the table `tiers` will be added. If there are existing duplicate values, this will fail.

*/
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

-- CreateIndex
CREATE UNIQUE INDEX `tiers_tier_name_key` ON `tiers`(`tier_name`);
