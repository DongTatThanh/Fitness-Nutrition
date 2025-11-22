-- Script để sửa password của Super Admin
-- Password: SuperAdmin123!

-- Xóa Super Admin cũ nếu có
DELETE FROM admins WHERE email = 'superadmin@example.com' AND role = 'super_admin';

-- Tạo lại Super Admin với password hash mới
-- Password: SuperAdmin123!
-- Hash này được tạo bằng: bcrypt.hash('SuperAdmin123!', 10)
INSERT INTO admins (email, password, full_name, role, is_active, created_at, updated_at)
VALUES (
  'superadmin@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Password: SuperAdmin123!
  'Super Administrator',
  'super_admin',
  1,
  NOW(),
  NOW()
);

-- Kiểm tra kết quả
SELECT 
  id as admin_id,
  email,
  full_name,
  role,
  is_active,
  LEFT(password, 20) as password_preview,
  created_at
FROM admins 
WHERE email = 'superadmin@example.com';

