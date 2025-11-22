-- ============================================
-- SỬA FOREIGN KEY - CHẠY TỪNG LỆNH
-- ============================================
-- MySQL không hỗ trợ IF EXISTS trong DROP FOREIGN KEY
-- Chạy từng lệnh một, nếu có lỗi thì bỏ qua và chạy tiếp

-- BƯỚC 1: Kiểm tra foreign key hiện tại
SELECT 
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'admin_activity_logs'
  AND CONSTRAINT_NAME = 'admin_activity_logs_ibfk_1';

-- BƯỚC 2: Tắt kiểm tra foreign key
SET FOREIGN_KEY_CHECKS = 0;

-- BƯỚC 3: Xóa foreign key cũ
-- ⚠️ Nếu có lỗi "Unknown foreign key", BỎ QUA và chạy tiếp BƯỚC 4
ALTER TABLE `admin_activity_logs` 
DROP FOREIGN KEY `admin_activity_logs_ibfk_1`;

-- BƯỚC 4: Bật lại kiểm tra foreign key
SET FOREIGN_KEY_CHECKS = 1;

-- BƯỚC 5: Thêm foreign key đúng (tham chiếu đến admins)
ALTER TABLE `admin_activity_logs`
ADD CONSTRAINT `admin_activity_logs_ibfk_1` 
FOREIGN KEY (`user_id`) 
REFERENCES `admins` (`id`) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- BƯỚC 6: Kiểm tra kết quả
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'admin_activity_logs'
  AND CONSTRAINT_NAME = 'admin_activity_logs_ibfk_1';

-- ✅ Kết quả mong đợi:
-- REFERENCED_TABLE_NAME = 'admins'
-- REFERENCED_COLUMN_NAME = 'id'

