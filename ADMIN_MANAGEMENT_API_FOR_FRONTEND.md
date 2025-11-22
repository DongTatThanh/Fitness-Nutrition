# 📚 API Quản lý Admin - Tài liệu cho Frontend

## 🔒 Authentication

Tất cả API đều yêu cầu header:
```
Authorization: Bearer <access_token>
```

---

## 1. 📋 Lấy danh sách Admin

### Endpoint
```http
GET /super-admin/list
```

### Headers
```
Authorization: Bearer <access_token>
```

### Response (200 OK)
```json
[
  {
    "id": 2,
    "admin_id": 2,
    "email": "admin1@example.com",
    "full_name": "Nguyễn Văn Admin",
    "phone": "0123456789",
    "role": "admin",
    "is_active": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 3,
    "admin_id": 3,
    "email": "manager1@example.com",
    "full_name": "Trần Thị Manager",
    "phone": "0987654321",
    "role": "manager",
    "is_active": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Lưu ý:** 
- Chỉ trả về Admin thường, không bao gồm Super Admin
- Response có cả `id` và `admin_id` (dùng field nào cũng được)

---

## 2. ➕ Tạo Admin mới

### Endpoint
```http
POST /super-admin/create-admin
```

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body
```json
{
  "email": "admin@example.com",
  "password": "Admin123!",
  "full_name": "Admin User",
  "phone": "0123456789",
  "role": "admin"
}
```

### Validation Rules
- `email`: Bắt buộc, phải đúng định dạng email, tối đa 100 ký tự
- `password`: Bắt buộc, tối thiểu 6 ký tự, tối đa 50 ký tự
- `full_name`: Tùy chọn, tối đa 100 ký tự
- `phone`: Tùy chọn, 10-11 chữ số
- `role`: Tùy chọn, chỉ có thể là `admin` hoặc `manager` (mặc định: `admin`)

### Response (201 Created)
```json
{
  "id": 4,
  "admin_id": 4,
  "email": "admin@example.com",
  "full_name": "Admin User",
  "phone": "0123456789",
  "role": "admin",
  "is_active": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

**400 Bad Request - Email đã tồn tại:**
```json
{
  "statusCode": 400,
  "message": "Email đã tồn tại trong hệ thống"
}
```

**400 Bad Request - Validation Error:**
```json
{
  "statusCode": 400,
  "message": "Email không đúng định dạng. Vui lòng nhập email hợp lệ; Mật khẩu phải có ít nhất 6 ký tự"
}
```

**403 Forbidden - Không được tạo Super Admin:**
```json
{
  "statusCode": 403,
  "message": "Không được phép tạo Super Admin. Super Admin chỉ có thể quản lý Admin thường."
}
```

---

## 3. 👁️ Xem chi tiết Admin

### Endpoint
```http
GET /super-admin/:id
```

### Headers
```
Authorization: Bearer <access_token>
```

### Parameters
- `id` (number): ID của Admin

### Response (200 OK)
```json
{
  "id": 2,
  "admin_id": 2,
  "email": "admin1@example.com",
  "full_name": "Nguyễn Văn Admin",
  "phone": "0123456789",
  "role": "admin",
  "is_active": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

**400 Bad Request - ID không hợp lệ:**
```json
{
  "statusCode": 400,
  "message": "ID phải là số nguyên dương"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Admin không tồn tại"
}
```

**403 Forbidden - Không được xem Super Admin:**
```json
{
  "statusCode": 403,
  "message": "Không được phép xem thông tin Super Admin. Super Admin chỉ có thể quản lý Admin thường."
}
```

---

## 4. ✏️ Cập nhật thông tin Admin

### Endpoint
```http
PUT /super-admin/:id
```

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Parameters
- `id` (number): ID của Admin

### Request Body
```json
{
  "full_name": "Updated Name",
  "phone": "0987654321"
}
```

**Lưu ý:** Phải cập nhật ít nhất một trường (`full_name` hoặc `phone`)

### Response (200 OK)
```json
{
  "id": 2,
  "admin_id": 2,
  "email": "admin1@example.com",
  "full_name": "Updated Name",
  "phone": "0987654321",
  "role": "admin",
  "is_active": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T12:00:00.000Z"
}
```

### Error Responses

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Phải cập nhật ít nhất một trường: full_name hoặc phone"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Không được phép sửa thông tin Super Admin."
}
```

---

## 5. 🔄 Đổi Role của Admin

### Endpoint
```http
PATCH /super-admin/:id/role
```

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Parameters
- `id` (number): ID của Admin

### Request Body
```json
{
  "role": "manager"
}
```

**Lưu ý:** 
- `role` chỉ có thể là `admin` hoặc `manager`
- Không được đổi thành `super_admin`

### Response (200 OK)
```json
{
  "id": 2,
  "admin_id": 2,
  "email": "admin1@example.com",
  "full_name": "Nguyễn Văn Admin",
  "phone": "0123456789",
  "role": "manager",
  "is_active": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T12:00:00.000Z"
}
```

### Error Responses

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Role phải là một trong các giá trị: admin, manager. Không được đổi thành Super Admin."
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Không được phép thay đổi role của Super Admin."
}
```

---

## 6. 🔘 Bật/Tắt Admin (Cập nhật trạng thái)

### Endpoint
```http
PATCH /super-admin/:id/status
```

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Parameters
- `id` (number): ID của Admin

### Request Body
```json
{
  "is_active": 0
}
```

**Giá trị:**
- `1` = Hoạt động
- `0` = Vô hiệu hóa

### Response (200 OK)
```json
{
  "id": 2,
  "admin_id": 2,
  "email": "admin1@example.com",
  "full_name": "Nguyễn Văn Admin",
  "phone": "0123456789",
  "role": "admin",
  "is_active": 0,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T12:00:00.000Z"
}
```

### Error Responses

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "is_active phải là 0 hoặc 1"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Không được phép thay đổi trạng thái của Super Admin."
}
```

---

## 7. 🔑 Đổi mật khẩu Admin

### Endpoint
```http
PATCH /super-admin/:id/password
```

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Parameters
- `id` (number): ID của Admin

### Request Body
```json
{
  "newPassword": "NewPassword123!"
}
```

### Response (200 OK)
```json
{
  "message": "Đổi mật khẩu thành công"
}
```

### Error Responses

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Mật khẩu phải có ít nhất 6 ký tự"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Không được phép đổi mật khẩu Super Admin."
}
```

---

## 8. 🗑️ Xóa Admin

### Endpoint
```http
DELETE /super-admin/:id
```

### Headers
```
Authorization: Bearer <access_token>
```

### Parameters
- `id` (number): ID của Admin

### Response (200 OK)
```json
{
  "message": "Xóa admin thành công"
}
```

### Error Responses

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "ID phải là số nguyên dương"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Admin không tồn tại"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Không được phép xóa Super Admin."
}
```

---

## 📊 Data Structure

### Admin Object
```typescript
interface Admin {
  id: number;              // ID của admin (dùng field này)
  admin_id: number;        // ID gốc (có thể dùng thay thế)
  email: string;           // Email (unique)
  full_name: string | null; // Họ và tên
  phone: string | null;    // Số điện thoại
  role: 'admin' | 'manager'; // Vai trò
  is_active: 0 | 1;       // Trạng thái (1 = hoạt động, 0 = vô hiệu hóa)
  created_at: string;      // Ngày tạo (ISO 8601)
  updated_at: string;      // Ngày cập nhật (ISO 8601)
}
```

---

## 🔄 Response Format Chuẩn

Tất cả API đều trả về format nhất quán:

### Success Response
```json
{
  "id": number,
  "admin_id": number,
  "email": string,
  "full_name": string | null,
  "phone": string | null,
  "role": string,
  "is_active": number,
  "created_at": string,
  "updated_at": string
}
```

### Error Response
```json
{
  "statusCode": number,
  "message": string
}
```

---

## 📝 Example Usage (JavaScript/TypeScript)

### 1. Lấy danh sách Admin
```typescript
const response = await fetch('http://localhost:3201/super-admin/list', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const admins = await response.json();
// admins là array: [{ id: 2, admin_id: 2, email: "...", ... }, ...]
```

### 2. Tạo Admin mới
```typescript
const response = await fetch('http://localhost:3201/super-admin/create-admin', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'Admin123!',
    full_name: 'Admin User',
    phone: '0123456789',
    role: 'admin'
  })
});
const newAdmin = await response.json();
// newAdmin: { id: 4, admin_id: 4, email: "...", ... }
```

### 3. Cập nhật Admin
```typescript
const response = await fetch(`http://localhost:3201/super-admin/${adminId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    full_name: 'Updated Name',
    phone: '0987654321'
  })
});
const updatedAdmin = await response.json();
```

### 4. Đổi Role
```typescript
const response = await fetch(`http://localhost:3201/super-admin/${adminId}/role`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    role: 'manager'
  })
});
const updatedAdmin = await response.json();
```

### 5. Bật/Tắt Admin
```typescript
const response = await fetch(`http://localhost:3201/super-admin/${adminId}/status`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    is_active: 0  // 0 = vô hiệu hóa, 1 = hoạt động
  })
});
const updatedAdmin = await response.json();
```

### 6. Đổi mật khẩu
```typescript
const response = await fetch(`http://localhost:3201/super-admin/${adminId}/password`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    newPassword: 'NewPassword123!'
  })
});
const result = await response.json();
// result: { message: "Đổi mật khẩu thành công" }
```

### 7. Xóa Admin
```typescript
const response = await fetch(`http://localhost:3201/super-admin/${adminId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const result = await response.json();
// result: { message: "Xóa admin thành công" }
```

---

## ⚠️ Lưu ý quan trọng

1. **ID Field:** Response có cả `id` và `admin_id`, frontend nên dùng `id` để nhất quán
2. **Chỉ quản lý Admin thường:** Không thể thao tác với Super Admin
3. **Role giới hạn:** Chỉ có thể tạo/sửa role thành `admin` hoặc `manager`
4. **Validation:** Tất cả validation messages đều bằng tiếng Việt
5. **Base URL:** `http://localhost:3201` (development)

---

## 📌 Quick Reference

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/super-admin/list` | Danh sách Admin |
| `POST` | `/super-admin/create-admin` | Tạo Admin mới |
| `GET` | `/super-admin/:id` | Chi tiết Admin |
| `PUT` | `/super-admin/:id` | Cập nhật thông tin |
| `PATCH` | `/super-admin/:id/role` | Đổi role |
| `PATCH` | `/super-admin/:id/status` | Bật/tắt Admin |
| `PATCH` | `/super-admin/:id/password` | Đổi mật khẩu |
| `DELETE` | `/super-admin/:id` | Xóa Admin |

