-- Tạo bảng admins nếu chưa tồn tại
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

-- Tạo Super Admin đầu tiên
-- Password: SuperAdmin123!
INSERT INTO admins (email, password, full_name, role, is_active, created_at, updated_at)
VALUES (
  'superadmin@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Password: SuperAdmin123!
  'Super Administrator',
  'super_admin',
  1,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE role = 'super_admin';

-- Kiểm tra kết quả
SELECT admin_id, email, full_name, role, is_active, created_at 
FROM admins 
WHERE role = 'super_admin';

