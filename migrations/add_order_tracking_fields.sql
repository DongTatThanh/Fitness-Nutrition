-- Migration: Add tracking and processing fields to orders table
-- Date: 2025-11-19

ALTER TABLE `orders` 
ADD COLUMN `tracking_number` varchar(100) DEFAULT NULL AFTER `handled_by`,
ADD COLUMN `shipping_carrier` varchar(100) DEFAULT NULL AFTER `tracking_number`,
ADD COLUMN `processing_at` timestamp NULL DEFAULT NULL AFTER `shipping_carrier`;

-- Add index for tracking
ALTER TABLE `orders` ADD INDEX `idx_tracking_number` (`tracking_number`);
