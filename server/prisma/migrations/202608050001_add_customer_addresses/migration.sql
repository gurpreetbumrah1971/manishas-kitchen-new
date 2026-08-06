CREATE TABLE IF NOT EXISTS `CustomerAddress` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `customerId` INTEGER NOT NULL,
  `label` VARCHAR(40) NOT NULL,
  `address` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `CustomerAddress_customerId_idx`(`customerId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `CustomerAddress_customerId_fkey`
    FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
