-- ============================================
-- KIỂM TRA VÀ SỬA FOREIGN KEY
-- ============================================

USE gymsinhvien;

-- 1. Kiểm tra foreign key hiện tại
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'gymsinhvien'
  AND TABLE_NAME = 'admin_activity_logs'
  AND CONSTRAINT_NAME LIKE '%ibfk%';

-- 2. Nếu REFERENCED_TABLE_NAME = 'users' thì cần sửa
-- Chạy các lệnh sau:

SET FOREIGN_KEY_CHECKS = 0;

-- Xóa foreign key cũ (có thể có lỗi nếu không tồn tại, bỏ qua)
ALTER TABLE `admin_activity_logs` 
DROP FOREIGN KEY `admin_activity_logs_ibfk_1`;

SET FOREIGN_KEY_CHECKS = 1;

-- Thêm foreign key đúng
ALTER TABLE `admin_activity_logs`
ADD CONSTRAINT `admin_activity_logs_ibfk_1` 
FOREIGN KEY (`user_id`) 
REFERENCES `admins` (`id`) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 3. Kiểm tra lại
SELECT 
    'RESULT:' as status,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'gymsinhvien'
  AND TABLE_NAME = 'admin_activity_logs'
  AND CONSTRAINT_NAME = 'admin_activity_logs_ibfk_1';

