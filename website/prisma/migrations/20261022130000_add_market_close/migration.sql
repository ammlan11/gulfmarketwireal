-- CreateTable
CREATE TABLE `MarketClose` (
    `symbol` VARCHAR(32) NOT NULL,
    `price` DOUBLE NOT NULL,
    `change` DOUBLE NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`symbol`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
