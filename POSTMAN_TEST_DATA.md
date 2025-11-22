# 📋 Data Test cho Postman - Admin Management

## 🔑 Bước 1: Đăng nhập để lấy Token

### Request: Login Super Admin
```http
POST http://localhost:3201/super-admin/auth/login
Content-Type: application/json

{
  "email": "superadmin@example.com",
  "password": "SuperAdmin123!"
}
```

### Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Lưu ý:** Copy `access_token` và dùng cho tất cả các request sau.

---

## ➕ TEST THÊM ADMIN

### Test Case 1: Tạo Admin đầy đủ thông tin
```http
POST http://localhost:3201/super-admin/create-admin
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "email": "testadmin1@example.com",
  "password": "Test123!",
  "full_name": "Test Admin 1",
  "phone": "0123456789",
  "role": "admin"
}
```

**Expected Response (201):**
```json
{
  "id": 4,
  "admin_id": 4,
  "email": "testadmin1@example.com",
  "full_name": "Test Admin 1",
  "phone": "0123456789",
  "role": "admin",
  "is_active": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

---

### Test Case 2: Tạo Manager
```http
POST http://localhost:3201/super-admin/create-admin
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "email": "testmanager1@example.com",
  "password": "Manager123!",
  "full_name": "Test Manager 1",
  "phone": "0987654321",
  "role": "manager"
}
```

---

### Test Case 3: Tạo Admin tối thiểu (chỉ email + password)
```http
POST http://localhost:3201/super-admin/create-admin
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "email": "minimal@example.com",
  "password": "Min123!"
}
```

---

### Test Case 4: Tạo Admin - Email trùng (Error)
```http
POST http://localhost:3201/super-admin/create-admin
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "email": "admin1@example.com",
  "password": "Test123!",
  "role": "admin"
}
```

**Expected Response (400):**
```json
{
  "statusCode": 400,
  "message": "Email đã tồn tại trong hệ thống"
}
```

---

### Test Case 5: Tạo Admin - Email không hợp lệ (Error)
```http
POST http://localhost:3201/super-admin/create-admin
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "email": "invalid-email",
  "password": "Test123!",
  "role": "admin"
}
```

**Expected Response (400):**
```json
{
  "statusCode": 400,
  "message": "Email không đúng định dạng. Vui lòng nhập email hợp lệ"
}
```

---

### Test Case 6: Tạo Admin - Password quá ngắn (Error)
```http
POST http://localhost:3201/super-admin/create-admin
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "email": "shortpass@example.com",
  "password": "123",
  "role": "admin"
}
```

**Expected Response (400):**
```json
{
  "statusCode": 400,
  "message": "Mật khẩu phải có ít nhất 6 ký tự"
}
```

---

## ✏️ TEST SỬA ADMIN

**Lưu ý:** Thay `{admin_id}` bằng ID thực tế của admin (ví dụ: 2, 3, 4...)

### Test Case 1: Cập nhật Full Name và Phone
```http
PUT http://localhost:3201/super-admin/2
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "full_name": "Updated Admin Name",
  "phone": "0999888777"
}
```

**Expected Response (200):**
```json
{
  "id": 2,
  "admin_id": 2,
  "email": "admin1@example.com",
  "full_name": "Updated Admin Name",
  "phone": "0999888777",
  "role": "admin",
  "is_active": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T12:00:00.000Z"
}
```

---

### Test Case 2: Chỉ cập nhật Full Name
```http
PUT http://localhost:3201/super-admin/2
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "full_name": "New Admin Name"
}
```

---

### Test Case 3: Chỉ cập nhật Phone
```http
PUT http://localhost:3201/super-admin/2
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "phone": "0111222333"
}
```

---

### Test Case 4: Cập nhật Role thành Manager
```http
PATCH http://localhost:3201/super-admin/2/role
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "role": "manager"
}
```

**Expected Response (200):**
```json
{
  "id": 2,
  "admin_id": 2,
  "email": "admin1@example.com",
  "full_name": "Updated Admin Name",
  "phone": "0999888777",
  "role": "manager",
  "is_active": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T12:00:00.000Z"
}
```

---

### Test Case 5: Cập nhật Role thành Admin
```http
PATCH http://localhost:3201/super-admin/2/role
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "role": "admin"
}
```

---

### Test Case 6: Vô hiệu hóa Admin (is_active = 0)
```http
PATCH http://localhost:3201/super-admin/2/status
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "is_active": 0
}
```

**Lưu ý:** 
- `is_active` phải là số (0 hoặc 1), không phải string
- Nếu gửi string "0" hoặc "1", sẽ tự động được chuyển đổi

**Expected Response (200):**
```json
{
  "id": 2,
  "admin_id": 2,
  "email": "admin1@example.com",
  "full_name": "Updated Admin Name",
  "phone": "0999888777",
  "role": "admin",
  "is_active": 0,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T12:00:00.000Z"
}
```

---

### Test Case 7: Kích hoạt Admin (is_active = 1)
```http
PATCH http://localhost:3201/super-admin/2/status
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "is_active": 1
}
```

---

### Test Case 8: Đổi mật khẩu Admin
```http
PATCH http://localhost:3201/super-admin/2/password
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "newPassword": "NewPassword123!"
}
```

**Expected Response (200):**
```json
{
  "message": "Đổi mật khẩu thành công"
}
```

---

### Test Case 9: Cập nhật với Body rỗng (Error)
```http
PUT http://localhost:3201/super-admin/2
Authorization: Bearer <your_token>
Content-Type: application/json

{}
```

**Expected Response (400):**
```json
{
  "statusCode": 400,
  "message": "Phải cập nhật ít nhất một trường: full_name hoặc phone"
}
```

---

## 🗑️ TEST XÓA ADMIN

### Test Case 1: Xóa Admin thành công
```http
DELETE http://localhost:3201/super-admin/2
Authorization: Bearer <your_token>
```

**Expected Response (200):**
```json
{
  "message": "Xóa admin thành công"
}
```

---

### Test Case 2: Xóa Admin không tồn tại (Error)
```http
DELETE http://localhost:3201/super-admin/99999
Authorization: Bearer <your_token>
```

**Expected Response (404):**
```json
{
  "statusCode": 404,
  "message": "Admin không tồn tại"
}
```

---

## 📋 TEST LẤY DANH SÁCH

### Test Case 1: Lấy tất cả Admin
```http
GET http://localhost:3201/super-admin/list
Authorization: Bearer <your_token>
```

**Expected Response (200):**
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

---

### Test Case 2: Lấy chi tiết Admin
```http
GET http://localhost:3201/super-admin/2
Authorization: Bearer <your_token>
```

**Expected Response (200):**
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

---

## 🔄 Quy trình Test đầy đủ

### Bước 1: Đăng nhập
```
POST /super-admin/auth/login
→ Lấy access_token
```

### Bước 2: Tạo Admin mới
```
POST /super-admin/create-admin
→ Lưu admin_id từ response
```

### Bước 3: Xem danh sách
```
GET /super-admin/list
→ Kiểm tra admin mới có trong danh sách
```

### Bước 4: Xem chi tiết
```
GET /super-admin/{admin_id}
→ Kiểm tra thông tin chi tiết
```

### Bước 5: Cập nhật thông tin
```
PUT /super-admin/{admin_id}
→ Kiểm tra thông tin đã được cập nhật
```

### Bước 6: Đổi role
```
PATCH /super-admin/{admin_id}/role
→ Kiểm tra role đã được đổi
```

### Bước 7: Bật/tắt trạng thái
```
PATCH /super-admin/{admin_id}/status
→ Kiểm tra trạng thái đã được thay đổi
```

### Bước 8: Đổi mật khẩu
```
PATCH /super-admin/{admin_id}/password
→ Kiểm tra mật khẩu đã được đổi
```

### Bước 9: Xóa Admin
```
DELETE /super-admin/{admin_id}
→ Kiểm tra admin đã bị xóa
```

### Bước 10: Xác nhận đã xóa
```
GET /super-admin/list
→ Kiểm tra admin không còn trong danh sách
```

---

## 📝 Data Test Mẫu

### Admin Test 1
```json
{
  "email": "testadmin1@example.com",
  "password": "Test123!",
  "full_name": "Test Admin 1",
  "phone": "0123456789",
  "role": "admin"
}
```

### Admin Test 2
```json
{
  "email": "testmanager1@example.com",
  "password": "Manager123!",
  "full_name": "Test Manager 1",
  "phone": "0987654321",
  "role": "manager"
}
```

### Admin Test 3
```json
{
  "email": "minimal@example.com",
  "password": "Min123!"
}
```

---

## ⚠️ Lưu ý

1. **Token:** Phải đăng nhập trước để lấy token
2. **Admin ID:** Thay `{admin_id}` bằng ID thực tế từ response
3. **Email unique:** Mỗi email chỉ được dùng 1 lần
4. **Role:** Chỉ có thể là `admin` hoặc `manager`
5. **Super Admin:** Không thể thao tác với Super Admin (ID = 1)

---

## 🚀 Import vào Postman

1. Mở Postman
2. Click **Import**
3. Chọn file `Postman_Admin_Management_Collection.json`
4. Collection sẽ được import với tất cả requests
5. Set variable `token` sau khi login
6. Set variable `admin_id` sau khi tạo admin mới

