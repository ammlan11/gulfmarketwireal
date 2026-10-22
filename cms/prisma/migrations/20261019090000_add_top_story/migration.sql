-- AlterTable
ALTER TABLE `NewsArticle` ADD COLUMN `isTopStory` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `NewsArticle_isTopStory_idx` ON `NewsArticle`(`isTopStory`);
