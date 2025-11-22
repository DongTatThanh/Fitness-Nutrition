-- ============================================
-- SỬA FOREIGN KEY AN TOÀN (Không lỗi nếu không tồn tại)
-- ============================================

-- Kiểm tra foreign key hiện tại
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

-- Tắt kiểm tra foreign key
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa foreign key cũ (chạy từng lệnh một, bỏ qua lỗi nếu không tồn tại)
-- Nếu có lỗi "Unknown foreign key", bỏ qua và chạy tiếp
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
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'admin_activity_logs'
  AND CONSTRAINT_NAME = 'admin_activity_logs_ibfk_1';

