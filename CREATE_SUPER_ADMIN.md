# Hướng dẫn tạo Super Admin

Có 3 cách để tạo Super Admin đầu tiên:

## Cách 1: Sử dụng Script Seed (Khuyến nghị)

### Bước 1: Cấu hình biến môi trường (tùy chọn)

Thêm vào file `.env`:

```env
SUPER_ADMIN_EMAIL=superadmin@example.com
SUPER_ADMIN_PASSWORD=SuperAdmin123!
SUPER_ADMIN_NAME=Super Administrator
```

Nếu không có, script sẽ sử dụng giá trị mặc định.

### Bước 2: Chạy script

```bash
npm run seed:super-admin
```

Hoặc:

```bash
npx ts-node -r tsconfig-paths/register src/seeds/create-super-admin.ts
```

### Kết quả:

Script sẽ hiển thị:
- ✅ Email: superadmin@example.com
- 🔑 Password: SuperAdmin123!
- 👤 Full Name: Super Administrator

## Cách 2: Sử dụng API Endpoint (Chỉ dùng một lần)

### Bước 1: Đăng ký Seed Controller (tạm thời)

Thêm vào `src/super-admin/super-admin.module.ts`:

```typescript
import { SuperAdminSeedController } from './super-admin-seed.controller';

@Module({
  // ...
  controllers: [SuperAdminController, SuperAdminSeedController], // Thêm dòng này
  // ...
})
```

### Bước 2: Gọi API

```bash
POST http://localhost:3201/super-admin/seed/create-first
Content-Type: application/json

{
  "email": "superadmin@example.com",
  "password": "SuperAdmin123!",
  "full_name": "Super Administrator"
}
```

### Bước 3: Xóa Seed Controller sau khi tạo xong

Xóa `SuperAdminSeedController` khỏi module để bảo mật.

## Cách 3: Tạo trực tiếp trong Database

### Chạy SQL script:

```sql
-- Tạo Super Admin đầu tiên
-- Password: SuperAdmin123! (đã được hash bằng bcrypt)

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
```

**Lưu ý:** Hash trên là cho password `SuperAdmin123!`. Nếu muốn password khác, cần hash lại bằng bcrypt.

## Đăng nhập

Sau khi tạo Super Admin, sử dụng thông tin sau để đăng nhập:

- **Endpoint:** `POST /super-admin/auth/login`
- **Email:** superadmin@example.com (hoặc email bạn đã đặt)
- **Password:** SuperAdmin123! (hoặc password bạn đã đặt)

## Lưu ý bảo mật

1. ⚠️ **Đổi mật khẩu ngay sau khi đăng nhập lần đầu**
2. ⚠️ **Xóa hoặc thay đổi biến môi trường sau khi sử dụng**
3. ⚠️ **Xóa Seed Controller sau khi tạo Super Admin đầu tiên**
4. ⚠️ **Không commit file `.env` có chứa thông tin Super Admin**

