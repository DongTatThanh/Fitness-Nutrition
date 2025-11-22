# 🔍 Hướng dẫn Debug Frontend Issues

## Vấn đề hiện tại

### 1. React Key Warning
```
Encountered two children with the same key, `undefined`
```
**Nguyên nhân:** DataTable đang map data mà không có key hoặc key là `undefined`

**Giải pháp:** Đảm bảo mỗi row có unique key:
```tsx
{data.map((admin, index) => (
  <tr key={admin.id || admin.admin_id || index}>
    ...
  </tr>
))}
```

### 2. 400 Bad Request - undefined ID
```
PATCH /api/super-admin/undefined/status
```
**Nguyên nhân:** Frontend đang gửi `undefined` làm admin ID

**Giải pháp:** Kiểm tra:
1. Response từ API có field `id` hoặc `admin_id` không
2. Frontend đang dùng đúng field không
3. Data mapping có đúng không

## Backend Response Format

Sau khi thêm `AdminResponseInterceptor`, tất cả response sẽ có cả `id` và `admin_id`:

```json
{
  "id": 2,              // ← Thêm mới (từ admin_id)
  "admin_id": 2,        // ← Original
  "email": "admin1@example.com",
  "full_name": "Nguyễn Văn Admin",
  "role": "admin",
  "is_active": 1,
  ...
}
```

## Kiểm tra Response

### Test API trực tiếp:
```bash
GET http://localhost:3201/super-admin/list
Authorization: Bearer <token>
```

Response sẽ có format:
```json
[
  {
    "id": 2,
    "admin_id": 2,
    "email": "admin1@example.com",
    ...
  }
]
```

## Frontend Fix

### 1. Sửa DataTable key:
```tsx
// Trước:
{admins.map(admin => <tr key={admin.id}>...</tr>)}

// Sau:
{admins.map(admin => (
  <tr key={admin.id || admin.admin_id || `admin-${admin.email}`}>
    ...
  </tr>
))}
```

### 2. Sửa handleToggleStatus:
```tsx
// Đảm bảo admin có ID trước khi gọi API
const handleToggleStatus = (admin) => {
  const adminId = admin.id || admin.admin_id;
  if (!adminId) {
    console.error('Admin ID is missing:', admin);
    return;
  }
  // ... rest of code
};
```

### 3. Normalize data khi nhận từ API:
```tsx
const normalizedAdmins = admins.map(admin => ({
  ...admin,
  id: admin.id || admin.admin_id,
}));
```

## Test

Sau khi sửa frontend, test lại:
1. ✅ Danh sách admin hiển thị đúng
2. ✅ Không còn React key warning
3. ✅ Toggle status hoạt động (không còn `undefined` ID)
4. ✅ Edit/Delete hoạt động

