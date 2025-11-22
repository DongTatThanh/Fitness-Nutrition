-- ============================================
-- CHẠY SCRIPT NÀY ĐỂ SỬA FOREIGN KEY
-- ============================================
-- Copy và chạy toàn bộ trong MySQL Workbench hoặc phpMyAdmin

USE gymsinhvien;

-- Tắt kiểm tra foreign key
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa foreign key cũ (có thể có lỗi, bỏ qua nếu có)
ALTER TABLE `admin_activity_logs` 
DROP FOREIGN KEY `admin_activity_logs_ibfk_1`;

-- Bật lại kiểm tra foreign key
SET FOREIGN_KEY_CHECKS = 1;

-- Thêm foreign key đúng (tham chiếu đến admins)
ALTER TABLE `admin_activity_logs`
ADD CONSTRAINT `admin_activity_logs_ibfk_1` 
FOREIGN KEY (`user_id`) 
REFERENCES `admins` (`id`) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Kiểm tra kết quả
SELECT 
    '✅ Foreign Key đã được sửa:' as status,
    REFERENCED_TABLE_NAME as 'Tham chiếu đến bảng',
    REFERENCED_COLUMN_NAME as 'Tham chiếu đến cột'
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'gymsinhvien'
  AND TABLE_NAME = 'admin_activity_logs'
  AND CONSTRAINT_NAME = 'admin_activity_logs_ibfk_1';

-- ✅ Kết quả đúng: Tham chiếu đến bảng = 'admins', Tham chiếu đến cột = 'id'

