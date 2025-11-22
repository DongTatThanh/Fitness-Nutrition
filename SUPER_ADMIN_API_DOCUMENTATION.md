# 📚 Tài liệu API Super Admin

## 🔐 Authentication Endpoints

### 1. Đăng nhập Super Admin
```http
POST /super-admin/auth/login
```

**Request Body:**
```json
{
  "email": "superadmin@example.com",
  "password": "SuperAdmin123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401):**
```json
{
  "message": "Email hoặc mật khẩu không đúng. Vui lòng thử lại"
}
```

---

### 2. Lấy thông tin Super Admin hiện tại
```http
GET /super-admin/auth/me
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "admin_id": 1,
  "email": "superadmin@example.com",
  "full_name": "Super Administrator",
  "role": "super_admin",
  "is_active": 1
}
```

---

### 3. Lấy profile Super Admin
```http
GET /super-admin/auth/profile
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "admin_id": 1,
  "email": "superadmin@example.com",
  "full_name": "Super Administrator",
  "phone": null,
  "role": "super_admin",
  "is_active": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. Đăng xuất Super Admin
```http
POST /super-admin/auth/logout
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Đăng xuất thành công"
}
```

---

## 👥 Admin Management Endpoints

### 5. Tạo Admin mới
```http
POST /super-admin/create-admin
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "Admin123!",
  "full_name": "Admin User",
  "phone": "0123456789",
  "role": "admin"
}
```

**Lưu ý:** 
- `role` chỉ có thể là `admin` hoặc `manager`
- Không được phép tạo Super Admin

**Response (201):**
```json
{
  "admin_id": 2,
  "email": "admin@example.com",
  "full_name": "Admin User",
  "phone": "0123456789",
  "role": "admin",
  "is_active": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Response (403):**
```json
{
  "message": "Không được phép tạo Super Admin. Super Admin chỉ có thể quản lý Admin thường."
}
```

---

### 6. Lấy danh sách Admin
```http
GET /super-admin/list
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "admin_id": 2,
    "email": "admin@example.com",
    "full_name": "Admin User",
    "phone": "0123456789",
    "role": "admin",
    "is_active": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Lưu ý:** Chỉ trả về Admin thường, không bao gồm Super Admin.

---

### 7. Lấy thông tin chi tiết Admin
```http
GET /super-admin/:id
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Parameters:**
- `id` (number): ID của Admin

**Response (200):**
```json
{
  "admin_id": 2,
  "email": "admin@example.com",
  "full_name": "Admin User",
  "phone": "0123456789",
  "role": "admin",
  "is_active": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Response (403):**
```json
{
  "message": "Không được phép xem thông tin Super Admin. Super Admin chỉ có thể quản lý Admin thường."
}
```

---

### 8. Cập nhật Role của Admin
```http
PATCH /super-admin/:id/role
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Parameters:**
- `id` (number): ID của Admin

**Request Body:**
```json
{
  "role": "manager"
}
```

**Lưu ý:** 
- `role` chỉ có thể là `admin` hoặc `manager`
- Không được phép đổi thành Super Admin
- Không được phép sửa role của Super Admin

**Response (200):**
```json
{
  "admin_id": 2,
  "email": "admin@example.com",
  "role": "manager",
  ...
}
```

**Response (403):**
```json
{
  "message": "Không được phép thay đổi role của Super Admin."
}
```

---

### 9. Cập nhật trạng thái Admin (Bật/Tắt)
```http
PATCH /super-admin/:id/status
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Parameters:**
- `id` (number): ID của Admin

**Request Body:**
```json
{
  "is_active": 0
}
```

**Response (200):**
```json
{
  "admin_id": 2,
  "email": "admin@example.com",
  "is_active": 0,
  ...
}
```

**Response (403):**
```json
{
  "message": "Không được phép thay đổi trạng thái của Super Admin."
}
```

---

### 10. Cập nhật thông tin Admin
```http
PUT /super-admin/:id
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Parameters:**
- `id` (number): ID của Admin

**Request Body:**
```json
{
  "full_name": "Updated Name",
  "phone": "0987654321"
}
```

**Response (200):**
```json
{
  "admin_id": 2,
  "email": "admin@example.com",
  "full_name": "Updated Name",
  "phone": "0987654321",
  ...
}
```

**Response (403):**
```json
{
  "message": "Không được phép sửa thông tin Super Admin."
}
```

---

### 11. Đổi mật khẩu Admin
```http
PATCH /super-admin/:id/password
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Parameters:**
- `id` (number): ID của Admin

**Request Body:**
```json
{
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "message": "Đổi mật khẩu thành công"
}
```

**Response (403):**
```json
{
  "message": "Không được phép đổi mật khẩu Super Admin."
}
```

---

### 12. Xóa Admin
```http
DELETE /super-admin/:id
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Parameters:**
- `id` (number): ID của Admin

**Response (200):**
```json
{
  "message": "Xóa admin thành công"
}
```

**Response (403):**
```json
{
  "message": "Không được phép xóa Super Admin."
}
```

---

## 📊 Activity Logs Endpoints

### 13. Lấy danh sách Activity Logs
```http
GET /super-admin/activity-logs
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (number, optional): Số trang (mặc định: 1)
- `limit` (number, optional): Số lượng mỗi trang (mặc định: 50)
- `user_id` (number, optional): Lọc theo user_id
- `action` (string, optional): Lọc theo action (ví dụ: CREATE_ADMIN)
- `entity_type` (string, optional): Lọc theo entity_type (ví dụ: admin)

**Example:**
```
GET /super-admin/activity-logs?page=1&limit=20&action=CREATE_ADMIN
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "action": "CREATE_ADMIN",
      "entity_type": "admin",
      "entity_id": 2,
      "details": {
        "email": "admin@example.com",
        "role": "admin"
      },
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "lastPage": 5
}
```

---

### 14. Lấy chi tiết Activity Log
```http
GET /super-admin/activity-logs/:id
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Parameters:**
- `id` (number): ID của Activity Log

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "action": "CREATE_ADMIN",
  "entity_type": "admin",
  "entity_id": 2,
  "details": {
    "email": "admin@example.com",
    "role": "admin"
  },
  "ip_address": "127.0.0.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

## 🔒 Authentication

Tất cả các endpoints (trừ `/auth/login`) đều yêu cầu:

**Header:**
```
Authorization: Bearer <access_token>
```

**Lỗi 401 (Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Lỗi 403 (Forbidden):**
```json
{
  "message": "Chỉ Super Admin mới có quyền truy cập"
}
```

---

## 📝 Validation Rules

### Email
- Không được để trống
- Phải đúng định dạng email
- Tối đa 100 ký tự

### Password
- Không được để trống
- Tối thiểu 6 ký tự
- Tối đa 50 ký tự

### Full Name
- Tối đa 100 ký tự

### Phone
- Phải là số
- Từ 10-11 chữ số

### Role
- Chỉ có thể là: `admin` hoặc `manager`
- Không được phép `super_admin`

---

## ⚠️ Lưu ý quan trọng

1. **Super Admin chỉ quản lý Admin thường:**
   - Không thể xem/sửa/xóa Super Admin
   - Không thể tạo Super Admin mới
   - Không thể đổi role thành Super Admin

2. **Tất cả thao tác đều được log:**
   - CREATE_ADMIN
   - UPDATE_ADMIN_ROLE
   - UPDATE_ADMIN_STATUS
   - CHANGE_ADMIN_PASSWORD
   - DELETE_ADMIN
   - LOGIN

3. **Base URL:**
   - Development: `http://localhost:3201`
   - Production: Thay đổi theo cấu hình

---

## 📌 Quick Reference

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/super-admin/auth/login` | Đăng nhập |
| GET | `/super-admin/auth/me` | Thông tin hiện tại |
| GET | `/super-admin/auth/profile` | Profile |
| POST | `/super-admin/auth/logout` | Đăng xuất |
| POST | `/super-admin/create-admin` | Tạo Admin |
| GET | `/super-admin/list` | Danh sách Admin |
| GET | `/super-admin/:id` | Chi tiết Admin |
| PATCH | `/super-admin/:id/role` | Đổi role |
| PATCH | `/super-admin/:id/status` | Bật/tắt Admin |
| PUT | `/super-admin/:id` | Cập nhật thông tin |
| PATCH | `/super-admin/:id/password` | Đổi mật khẩu |
| DELETE | `/super-admin/:id` | Xóa Admin |
| GET | `/super-admin/activity-logs` | Danh sách logs |
| GET | `/super-admin/activity-logs/:id` | Chi tiết log |

