-- ============================================
-- SỬA PASSWORD SUPER ADMIN NGAY LẬP TỨC
-- ============================================
-- Chạy script này để cập nhật password hash đúng
-- Password: SuperAdmin123!

UPDATE admins 
SET 
  password = '$2a$10$naVO5vJDKbuF8vXK8iEzjeSgYwaXjR6YGCjcMN2MM0n0WfXhwMRSC',
  role = 'super_admin',
  is_active = 1,
  updated_at = NOW()
WHERE email = 'superadmin@example.com';

-- Kiểm tra kết quả
SELECT 
  id as admin_id,
  email,
  full_name,
  role,
  is_active,
  LEFT(password, 30) as password_hash_preview,
  updated_at
FROM admins 
WHERE email = 'superadmin@example.com';

-- Nếu không có kết quả, có nghĩa là chưa có Super Admin
-- Hãy chạy file: database/create-admin-tables.sql

