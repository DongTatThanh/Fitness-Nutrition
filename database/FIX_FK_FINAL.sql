-- ============================================
-- SỬA FOREIGN KEY - SCRIPT HOÀN CHỈNH
-- ============================================
-- Chạy toàn bộ script này trong MySQL

USE gymsinhvien;

-- Bước 1: Kiểm tra foreign key hiện tại
SELECT 
    'BEFORE FIX - Current Foreign Key:' as info,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'gymsinhvien'
  AND TABLE_NAME = 'admin_activity_logs'
  AND CONSTRAINT_NAME = 'admin_activity_logs_ibfk_1';

-- Bước 2: Tắt kiểm tra foreign key
SET FOREIGN_KEY_CHECKS = 0;

-- Bước 3: Xóa foreign key cũ
-- Nếu có lỗi ở đây, có thể foreign key không tồn tại hoặc tên khác
-- Bỏ qua lỗi và chạy tiếp
ALTER TABLE `admin_activity_logs` 
DROP FOREIGN KEY `admin_activity_logs_ibfk_1`;

-- Bước 4: Bật lại kiểm tra foreign key
SET FOREIGN_KEY_CHECKS = 1;

-- Bước 5: Thêm foreign key đúng (tham chiếu đến admins)
ALTER TABLE `admin_activity_logs`
ADD CONSTRAINT `admin_activity_logs_ibfk_1` 
FOREIGN KEY (`user_id`) 
REFERENCES `admins` (`id`) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Bước 6: Kiểm tra kết quả
SELECT 
    'AFTER FIX - New Foreign Key:' as info,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'gymsinhvien'
  AND TABLE_NAME = 'admin_activity_logs'
  AND CONSTRAINT_NAME = 'admin_activity_logs_ibfk_1';

-- ✅ Kết quả mong đợi:
-- REFERENCED_TABLE_NAME = 'admins'
-- REFERENCED_COLUMN_NAME = 'id'

