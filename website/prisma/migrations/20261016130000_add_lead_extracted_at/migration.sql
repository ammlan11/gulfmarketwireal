-- AlterTable
ALTER TABLE `Lead` ADD COLUMN `extractedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Lead_extractedAt_idx` ON `Lead`(`extractedAt`);
