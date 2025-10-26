-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `File` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `fileType` ENUM('EXCEL', 'IMAGE') NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `aesPath` VARCHAR(191) NOT NULL,
    `desPath` VARCHAR(191) NOT NULL,
    `rc4Path` VARCHAR(191) NOT NULL,
    `originalSize` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,

    INDEX `File_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EncryptionMetric` (
    `id` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NOT NULL,
    `algorithm` ENUM('AES', 'DES', 'RC4') NOT NULL,
    `encryptionTime` DOUBLE NOT NULL,
    `decryptionTime` DOUBLE NULL,
    `ciphertextSize` INTEGER NOT NULL,
    `dataType` ENUM('NUMERICAL', 'SPREADSHEET', 'IMAGE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EncryptionMetric_fileId_idx`(`fileId`),
    INDEX `EncryptionMetric_algorithm_idx`(`algorithm`),
    INDEX `EncryptionMetric_dataType_idx`(`dataType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinancialReport` (
    `id` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FinancialReport_fileId_key`(`fileId`),
    INDEX `FinancialReport_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EncryptedReportField` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `encryptedValue` TEXT NOT NULL,
    `algorithm` ENUM('AES', 'DES', 'RC4') NOT NULL,
    `iv` VARCHAR(191) NULL,

    INDEX `EncryptedReportField_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FileShare` (
    `id` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `sharedWithUserId` VARCHAR(191) NOT NULL,
    `sharedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FileShare_fileId_idx`(`fileId`),
    INDEX `FileShare_ownerId_idx`(`ownerId`),
    INDEX `FileShare_sharedWithUserId_idx`(`sharedWithUserId`),
    UNIQUE INDEX `FileShare_fileId_sharedWithUserId_key`(`fileId`, `sharedWithUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EncryptionMetric` ADD CONSTRAINT `EncryptionMetric_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `File`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialReport` ADD CONSTRAINT `FinancialReport_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `File`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialReport` ADD CONSTRAINT `FinancialReport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EncryptedReportField` ADD CONSTRAINT `EncryptedReportField_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `FinancialReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileShare` ADD CONSTRAINT `FileShare_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `File`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileShare` ADD CONSTRAINT `FileShare_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileShare` ADD CONSTRAINT `FileShare_sharedWithUserId_fkey` FOREIGN KEY (`sharedWithUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
