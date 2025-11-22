# 🔧 Hướng dẫn sửa password Super Admin

## Vấn đề

Password hash trong database không khớp với password `SuperAdmin123!`

## Giải pháp

### Cách 1: Chạy SQL Script (Nhanh nhất)

1. Mở MySQL Workbench hoặc phpMyAdmin
2. Chọn database `gymsinhvien`
3. Chạy file: `database/FIX_PASSWORD_NOW.sql`

Hoặc chạy trực tiếp SQL sau:

```sql
UPDATE admins 
SET 
  password = '$2a$10$naVO5vJDKbuF8vXK8iEzjeSgYwaXjR6YGCjcMN2MM0n0WfXhwMRSC',
  role = 'super_admin',
  is_active = 1,
  updated_at = NOW()
WHERE email = 'superadmin@example.com';
```

### Cách 2: Sử dụng Command Line

```bash
mysql -u root -p gymsinhvien < database/FIX_PASSWORD_NOW.sql
```

### Cách 3: Verify sau khi update

Sau khi chạy SQL, chạy lệnh để kiểm tra:

```bash
npm run verify:super-admin
```

Nếu thấy `✅ Password "SuperAdmin123!" KHỚP` thì đã thành công!

## Thông tin đăng nhập

Sau khi cập nhật password:

- **Email:** `superadmin@example.com`
- **Password:** `SuperAdmin123!`

## Lưu ý

- ⚠️ Đảm bảo đã chạy SQL update trước khi thử đăng nhập lại
- ⚠️ Nếu vẫn lỗi, kiểm tra xem Super Admin đã được tạo chưa bằng cách chạy `database/create-admin-tables.sql`

