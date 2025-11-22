# 🔧 Sửa lỗi Update Admin Status

## ❌ Lỗi hiện tại

```
400 Bad Request
{
  "message": "Trạng thái phải là 0 (vô hiệu hóa) hoặc 1 (kích hoạt)",
  "error": "Bad Request",
  "statusCode": 400
}
```

## ✅ Request Body đúng

### Cách 1: Gửi số (Number)
```json
{
  "is_active": 0
}
```

### Cách 2: Gửi string (sẽ tự động chuyển đổi)
```json
{
  "is_active": "0"
}
```

## 📝 Test trong Postman

### Request:
```
PATCH http://localhost:3201/super-admin/2/status
Authorization: Bearer <your_token>
Content-Type: application/json

Body (raw JSON):
{
  "is_active": 0
}
```

### Hoặc:
```json
{
  "is_active": 1
}
```

## ✅ Expected Response (200)

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

## ⚠️ Lưu ý

- `is_active` phải là **0** hoặc **1** (số hoặc string)
- Không được gửi `"is_active": "active"` hoặc `"is_active": true`
- Chỉ chấp nhận: `0`, `1`, `"0"`, `"1"`

