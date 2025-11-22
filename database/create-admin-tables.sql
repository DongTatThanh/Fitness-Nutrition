-- ============================================
-- TẠO CÁC BẢNG CHO HỆ THỐNG ADMIN
-- ============================================

-- 1. Tạo bảng admins
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'admin',
  `is_active` tinyint DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tạo bảng admin_roles
CREATE TABLE IF NOT EXISTS `admin_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(100) NOT NULL,
  `permissions` json DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tạo bảng admin_activity_logs
CREATE TABLE IF NOT EXISTS `admin_activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `admin_activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TẠO SUPER ADMIN ĐẦU TIÊN
-- ============================================

-- Tạo Super Admin với thông tin mặc định
-- Email: superadmin@example.com
-- Password: SuperAdmin123!
-- Hash mới (đã verify): $2a$10$bQ6XiOY9ecjqIU05gKA5wOEw9BmUhP2vLYxG/c47DGPRGqii/T7LW
INSERT INTO admins (email, password, full_name, role, is_active, created_at, updated_at)
VALUES (
  'superadmin@example.com',
  '$2a$10$bQ6XiOY9ecjqIU05gKA5wOEw9BmUhP2vLYxG/c47DGPRGqii/T7LW', -- Password: SuperAdmin123! (hash đã verify)
  'Super Administrator',
  'super_admin',
  1,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE 
  password = '$2a$10$bQ6XiOY9ecjqIU05gKA5wOEw9BmUhP2vLYxG/c47DGPRGqii/T7LW',
  role = 'super_admin',
  is_active = 1;

-- ============================================
-- KIỂM TRA KẾT QUẢ
-- ============================================

-- Kiểm tra Super Admin đã được tạo
SELECT 
  admin_id as id,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM admins 
WHERE role = 'super_admin';

-- Đếm số lượng admin
SELECT COUNT(*) as total_admins FROM admins;
SELECT COUNT(*) as total_super_admins FROM admins WHERE role = 'super_admin';

