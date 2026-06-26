-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema petty_db
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema petty_db
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `petty_db` DEFAULT CHARACTER SET utf8mb4 ;
USE `petty_db` ;

-- -----------------------------------------------------
-- Table `petty_db`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `petty_db`.`users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `token` VARCHAR(255) NULL DEFAULT NULL,
  `image_path` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `delivery_address` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_2` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_3` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_4` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_5` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_6` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_7` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_8` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_9` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_10` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_11` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_12` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_13` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_14` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_15` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_16` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_17` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_18` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_19` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_20` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_21` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_22` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_23` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_24` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_25` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_26` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_27` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_28` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_29` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_30` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_31` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_32` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_33` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_34` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_35` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_36` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_37` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_38` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_39` (`email` ASC) VISIBLE,
  UNIQUE INDEX `email_40` (`email` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `petty_db`.`cart`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `petty_db`.`cart` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_id` (`user_id` ASC) VISIBLE,
  CONSTRAINT `cart_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `petty_db`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `petty_db`.`categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `petty_db`.`categories` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `image_path` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `petty_db`.`products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `petty_db`.`products` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `category_id` INT(11) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `stock` INT(11) NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  INDEX `category_id` (`category_id` ASC) VISIBLE,
  CONSTRAINT `products_ibfk_1`
    FOREIGN KEY (`category_id`)
    REFERENCES `petty_db`.`categories` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `petty_db`.`cart_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `petty_db`.`cart_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `cart_id` INT(11) NOT NULL,
  `product_id` INT(11) NOT NULL,
  `quantity` INT(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `cart_id` (`cart_id` ASC) VISIBLE,
  INDEX `product_id` (`product_id` ASC) VISIBLE,
  CONSTRAINT `cart_items_ibfk_79`
    FOREIGN KEY (`cart_id`)
    REFERENCES `petty_db`.`cart` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `cart_items_ibfk_80`
    FOREIGN KEY (`product_id`)
    REFERENCES `petty_db`.`products` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `petty_db`.`orders`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `petty_db`.`orders` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `status` ENUM('Pending', 'Paid', 'Cancelled', 'Completed') NOT NULL DEFAULT 'Pending',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  CONSTRAINT `orders_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `petty_db`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `petty_db`.`order_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `petty_db`.`order_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `product_id` INT(11) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `quantity` INT(11) NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `order_id` (`order_id` ASC) VISIBLE,
  INDEX `product_id` (`product_id` ASC) VISIBLE,
  CONSTRAINT `order_items_ibfk_1`
    FOREIGN KEY (`order_id`)
    REFERENCES `petty_db`.`orders` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2`
    FOREIGN KEY (`product_id`)
    REFERENCES `petty_db`.`products` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `petty_db`.`product_images`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `petty_db`.`product_images` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `product_id` INT(11) NOT NULL,
  `image_path` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `product_id` (`product_id` ASC) VISIBLE,
  CONSTRAINT `product_images_ibfk_1`
    FOREIGN KEY (`product_id`)
    REFERENCES `petty_db`.`products` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `petty_db`.`reviews`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `petty_db`.`reviews` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `product_id` INT(11) NOT NULL,
  `rating` TINYINT(4) NOT NULL,
  `comment` TEXT NULL DEFAULT NULL,
  `verified_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `reviews_user_id_product_id` (`user_id` ASC, `product_id` ASC) VISIBLE,
  INDEX `product_id` (`product_id` ASC) VISIBLE,
  CONSTRAINT `reviews_ibfk_1`
    FOREIGN KEY (`product_id`)
    REFERENCES `petty_db`.`products` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
