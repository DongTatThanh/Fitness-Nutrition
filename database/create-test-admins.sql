-- ============================================
-- TẠO 3 ADMIN MẪU ĐỂ TEST
-- ============================================
-- Password cho tất cả: Admin123!
-- Hash: $2a$10$fRvGKS25RKxRXxHISO7kEeWFMVVH23.kmO58fxhqoduevJpxwoF4S

-- Admin 1: Admin thường
INSERT INTO admins (email, password, full_name, phone, role, is_active, created_at, updated_at)
VALUES (
  'admin1@example.com',
  '$2a$10$fRvGKS25RKxRXxHISO7kEeWFMVVH23.kmO58fxhqoduevJpxwoF4S', -- Password: Admin123!
  'Nguyễn Văn Admin',
  '0123456789',
  'admin',
  1,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  password = '$2a$10$fRvGKS25RKxRXxHISO7kEeWFMVVH23.kmO58fxhqoduevJpxwoF4S',
  full_name = 'Nguyễn Văn Admin',
  phone = '0123456789',
  role = 'admin',
  is_active = 1;

-- Admin 2: Manager
INSERT INTO admins (email, password, full_name, phone, role, is_active, created_at, updated_at)
VALUES (
  'manager1@example.com',
  '$2a$10$fRvGKS25RKxRXxHISO7kEeWFMVVH23.kmO58fxhqoduevJpxwoF4S', -- Password: Admin123!
  'Trần Thị Manager',
  '0987654321',
  'manager',
  1,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  password = '$2a$10$fRvGKS25RKxRXxHISO7kEeWFMVVH23.kmO58fxhqoduevJpxwoF4S',
  full_name = 'Trần Thị Manager',
  phone = '0987654321',
  role = 'manager',
  is_active = 1;

-- Admin 3: Admin thường (bị vô hiệu hóa)
INSERT INTO admins (email, password, full_name, phone, role, is_active, created_at, updated_at)
VALUES (
  'admin2@example.com',
  '$2a$10$fRvGKS25RKxRXxHISO7kEeWFMVVH23.kmO58fxhqoduevJpxwoF4S', -- Password: Admin123!
  'Lê Văn Test',
  '0111222333',
  'admin',
  0, -- Bị vô hiệu hóa
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  password = '$2a$10$fRvGKS25RKxRXxHISO7kEeWFMVVH23.kmO58fxhqoduevJpxwoF4S',
  full_name = 'Lê Văn Test',
  phone = '0111222333',
  role = 'admin',
  is_active = 0;

-- Kiểm tra kết quả
SELECT 
  id as admin_id,
  email,
  full_name,
  phone,
  role,
  is_active,
  created_at
FROM admins 
WHERE role != 'super_admin'
ORDER BY created_at DESC;

