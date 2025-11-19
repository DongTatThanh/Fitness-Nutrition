-- Migration: Make user_id nullable in product_views table
-- This allows guest users (not logged in) to track product views
-- Date: 2025-11-19

USE gymsinhvien;

-- Make user_id nullable
ALTER TABLE product_views 
MODIFY COLUMN user_id INT NULL;

-- Verify the change
DESCRIBE product_views;

-- Show sample data
SELECT * FROM product_views LIMIT 5;
