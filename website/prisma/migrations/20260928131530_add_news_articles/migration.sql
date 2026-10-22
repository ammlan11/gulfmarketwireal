-- CreateTable
CREATE TABLE `NewsArticle` (
    `id` VARCHAR(64) NOT NULL,
    `title` TEXT NOT NULL,
    `description` TEXT NULL,
    `content` LONGTEXT NULL,
    `imageUrl` TEXT NULL,
    `source` VARCHAR(255) NOT NULL,
    `sourceUrl` TEXT NULL,
    `url` TEXT NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `category` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `NewsArticle_publishedAt_idx`(`publishedAt`),
    INDEX `NewsArticle_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
