# 📋 Thông tin Test Admins

Đã tạo thành công **3 admin mẫu** để test các chức năng thêm, sửa, xóa.

## 🔑 Thông tin đăng nhập

**Password cho tất cả admin:** `Admin123!`

---

## 👥 Danh sách Test Admins

### 1. Admin thường (Hoạt động)
- **Email:** `admin1@example.com`
- **Password:** `Admin123!`
- **Full Name:** Nguyễn Văn Admin
- **Phone:** 0123456789
- **Role:** `admin`
- **Status:** ✅ Hoạt động (is_active = 1)

### 2. Manager (Hoạt động)
- **Email:** `manager1@example.com`
- **Password:** `Admin123!`
- **Full Name:** Trần Thị Manager
- **Phone:** 0987654321
- **Role:** `manager`
- **Status:** ✅ Hoạt động (is_active = 1)

### 3. Admin thường (Vô hiệu hóa)
- **Email:** `admin2@example.com`
- **Password:** `Admin123!`
- **Full Name:** Lê Văn Test
- **Phone:** 0111222333
- **Role:** `admin`
- **Status:** ❌ Vô hiệu hóa (is_active = 0)

---

## 🧪 Test Cases

### Test Thêm Admin
1. Đăng nhập Super Admin
2. Tạo admin mới với email khác
3. Kiểm tra admin mới xuất hiện trong danh sách

### Test Sửa Admin
1. Cập nhật thông tin admin (full_name, phone)
2. Đổi role (admin ↔ manager)
3. Bật/tắt trạng thái (is_active)
4. Đổi mật khẩu

### Test Xóa Admin
1. Xóa admin thường
2. Kiểm tra admin đã bị xóa khỏi danh sách

### Test Giới hạn
1. ❌ Không thể xem/sửa/xóa Super Admin
2. ❌ Không thể tạo Super Admin mới
3. ❌ Không thể đổi role thành Super Admin

---

## 🔧 Tạo lại Test Admins

### Cách 1: Sử dụng Script (Khuyến nghị)
```bash
npm run seed:test-admins
```

### Cách 2: Chạy SQL
```sql
-- File: database/create-test-admins.sql
```

---

## 📝 Lưu ý

- Tất cả admin đều có cùng password: `Admin123!`
- Admin có thể đăng nhập tại endpoint Admin thường (không phải Super Admin)
- Super Admin chỉ quản lý được Admin thường, không quản lý được Super Admin

