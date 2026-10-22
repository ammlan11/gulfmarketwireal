-- CreateTable
CREATE TABLE `NewsArticle` (
    `id` VARCHAR(64) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `content` LONGTEXT NULL,
    `imageUrl` TEXT NULL,
    `source` VARCHAR(255) NOT NULL,
    `sourceUrl` TEXT NULL,
    `url` VARCHAR(700) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `category` VARCHAR(64) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NewsArticle_url_key`(`url`),
    INDEX `NewsArticle_category_idx`(`category`),
    INDEX `NewsArticle_publishedAt_idx`(`publishedAt`),
    INDEX `NewsArticle_status_publishedAt_idx`(`status`, `publishedAt`),
    INDEX `NewsArticle_category_status_publishedAt_idx`(`category`, `status`, `publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
