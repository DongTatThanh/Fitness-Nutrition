-- Script SQL để tạo Super Admin đầu tiên
-- Password mặc định: SuperAdmin123!
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- Kiểm tra xem đã có Super Admin chưa
SELECT COUNT(*) as super_admin_count 
FROM admins 
WHERE role = 'super_admin';

-- Nếu chưa có, chạy lệnh INSERT sau:
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

-- Kiểm tra lại
SELECT admin_id, email, full_name, role, is_active, created_at 
FROM admins 
WHERE role = 'super_admin';

    