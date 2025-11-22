# 📋 Tóm tắt API Super Admin

## 🔐 Authentication (4 APIs)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/super-admin/auth/login` | Đăng nhập |
| `GET` | `/super-admin/auth/me` | Thông tin hiện tại |
| `GET` | `/super-admin/auth/profile` | Profile |
| `POST` | `/super-admin/auth/logout` | Đăng xuất |

---

## 👥 Admin Management (8 APIs)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/super-admin/create-admin` | Tạo Admin mới |
| `GET` | `/super-admin/list` | Danh sách Admin (chỉ Admin thường) |
| `GET` | `/super-admin/:id` | Chi tiết Admin |
| `PATCH` | `/super-admin/:id/role` | Đổi role (admin/manager) |
| `PATCH` | `/super-admin/:id/status` | Bật/tắt Admin |
| `PUT` | `/super-admin/:id` | Cập nhật thông tin |
| `PATCH` | `/super-admin/:id/password` | Đổi mật khẩu |
| `DELETE` | `/super-admin/:id` | Xóa Admin |

**⚠️ Lưu ý:** Tất cả các API này chỉ quản lý Admin thường, không thể quản lý Super Admin.

---

## 📊 Activity Logs (2 APIs)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/super-admin/activity-logs` | Danh sách logs (có filter) |
| `GET` | `/super-admin/activity-logs/:id` | Chi tiết log |

**Query Parameters cho activity-logs:**
- `page` - Số trang
- `limit` - Số lượng mỗi trang
- `user_id` - Lọc theo user
- `action` - Lọc theo action (CREATE_ADMIN, UPDATE_ADMIN_ROLE, etc.)
- `entity_type` - Lọc theo entity type

---

## 🔒 Authentication Header

Tất cả API (trừ `/auth/login`) đều cần:

```
Authorization: Bearer <access_token>
```

---

## 📝 Request/Response Examples

### 1. Đăng nhập
```bash
POST /super-admin/auth/login
Content-Type: application/json

{
  "email": "superadmin@example.com",
  "password": "SuperAdmin123!"
}
```

### 2. Tạo Admin
```bash
POST /super-admin/create-admin
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin123!",
  "full_name": "Admin User",
  "phone": "0123456789",
  "role": "admin"
}
```

### 3. Lấy danh sách Admin
```bash
GET /super-admin/list
Authorization: Bearer <token>
```

### 4. Cập nhật Role
```bash
PATCH /super-admin/2/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "manager"
}
```

### 5. Xóa Admin
```bash
DELETE /super-admin/2
Authorization: Bearer <token>
```

---

## ⚠️ Quy tắc quan trọng

1. ✅ **Chỉ quản lý Admin thường** - Không thể quản lý Super Admin
2. ✅ **Không tạo Super Admin** - Role chỉ có thể là `admin` hoặc `manager`
3. ✅ **Tất cả thao tác đều được log** - Theo dõi trong Activity Logs
4. ✅ **Validation tiếng Việt** - Tất cả thông báo lỗi bằng tiếng Việt

---

## 📌 Base URL

- **Development:** `http://localhost:3201`
- **Production:** Thay đổi theo cấu hình

---

Xem chi tiết đầy đủ tại: `SUPER_ADMIN_API_DOCUMENTATION.md`

