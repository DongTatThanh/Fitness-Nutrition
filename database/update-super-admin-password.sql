-- Cập nhật password của Super Admin
-- Password: SuperAdmin123!
-- Hash đã được verify và hoạt động đúng

UPDATE admins 
SET 
  password = '$2a$10$bQ6XiOY9ecjqIU05gKA5wOEw9BmUhP2vLYxG/c47DGPRGqii/T7LW',
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

