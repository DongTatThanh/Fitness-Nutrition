-- ============================================
-- SỬA FOREIGN KEY NGAY LẬP TỨC
-- ============================================
-- Vấn đề: admin_activity_logs.user_id đang tham chiếu users thay vì admins

-- Bước 1: Tắt kiểm tra foreign key
SET FOREIGN_KEY_CHECKS = 0;

-- Bước 2: Xóa foreign key constraint cũ (nếu có)
-- Lưu ý: MySQL không hỗ trợ IF EXISTS, nên sẽ bỏ qua lỗi nếu không tồn tại
ALTER TABLE `admin_activity_logs` 
DROP FOREIGN KEY `admin_activity_logs_ibfk_1`;

-- Bước 3: Bật lại kiểm tra foreign key
SET FOREIGN_KEY_CHECKS = 1;

-- Bước 4: Thêm foreign key constraint đúng (tham chiếu đến admins)
ALTER TABLE `admin_activity_logs`
ADD CONSTRAINT `admin_activity_logs_ibfk_1` 
FOREIGN KEY (`user_id`) 
REFERENCES `admins` (`id`) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Kiểm tra kết quả
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'gymsinhvien'
  AND TABLE_NAME = 'admin_activity_logs'
  AND CONSTRAINT_NAME = 'admin_activity_logs_ibfk_1';

