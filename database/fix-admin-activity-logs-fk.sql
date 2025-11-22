-- ============================================
-- SỬA FOREIGN KEY CHO admin_activity_logs
-- ============================================
-- Vấn đề: Foreign key đang tham chiếu đến users thay vì admins

-- Bước 1: Xóa foreign key constraint cũ (nếu có)
ALTER TABLE `admin_activity_logs` 
DROP FOREIGN KEY IF EXISTS `admin_activity_logs_ibfk_1`;

-- Bước 2: Xóa index cũ (nếu có)
ALTER TABLE `admin_activity_logs` 
DROP INDEX IF EXISTS `user_id`;

-- Bước 3: Thêm foreign key constraint đúng (tham chiếu đến admins)
ALTER TABLE `admin_activity_logs`
ADD CONSTRAINT `admin_activity_logs_ibfk_1` 
FOREIGN KEY (`user_id`) 
REFERENCES `admins` (`id`) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Bước 4: Thêm index để tối ưu query
ALTER TABLE `admin_activity_logs`
ADD INDEX `idx_user_id` (`user_id`);

-- Kiểm tra kết quả
SHOW CREATE TABLE `admin_activity_logs`;

