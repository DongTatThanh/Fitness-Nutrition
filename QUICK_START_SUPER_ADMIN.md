# Hướng dẫn nhanh: Tạo và đăng nhập Super Admin

## Bước 1: Tạo bảng và Super Admin trong Database

Chạy file SQL trong MySQL:

```bash
# Mở MySQL và chạy file:
database/create-admin-tables.sql
```

Hoặc chạy trực tiếp:

```sql
-- Tạo bảng admins
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'admin',
  `is_active` tinyint DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo Super Admin
INSERT INTO admins (email, password, full_name, role, is_active, created_at, updated_at)
VALUES (
  'superadmin@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Super Administrator',
  'super_admin',
  1,
  NOW(),
  NOW()
);
```

## Bước 2: Cấu hình Frontend

### Option A: Gọi trực tiếp đến Backend (Đơn giản nhất)

Cập nhật file API config trong frontend:

```typescript
// Thay vì: /api/super-admin/auth/login
// Gọi: http://localhost:3201/super-admin/auth/login

const API_BASE_URL = 'http://localhost:3201';
```

### Option B: Tạo Next.js API Route Proxy

Copy file từ `frontend-api-routes-example/` vào frontend project:

- **App Router:** Copy `app/api/super-admin/[...path]/route.ts`
- **Pages Router:** Copy `pages/api/super-admin/[...path].ts`

Thêm vào `.env.local` (frontend):
```env
BACKEND_URL=http://localhost:3201
```

## Bước 3: Đăng nhập

**Thông tin đăng nhập:**
- **Email:** `superadmin@example.com`
- **Password:** `SuperAdmin123!`

**Endpoint:**
- Trực tiếp: `POST http://localhost:3201/super-admin/auth/login`
- Qua proxy: `POST http://localhost:3002/api/super-admin/auth/login`

**Request:**
```json
{
  "email": "superadmin@example.com",
  "password": "SuperAdmin123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Lưu ý

1. ⚠️ Backend đang chạy trên port **3201** (không phải 3000)
2. ⚠️ Đổi mật khẩu ngay sau khi đăng nhập
3. ⚠️ Đảm bảo backend đang chạy trước khi test

