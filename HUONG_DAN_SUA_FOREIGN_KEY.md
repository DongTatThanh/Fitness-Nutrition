# 🔧 Hướng dẫn sửa Foreign Key

## ❌ Lỗi hiện tại

```
Cannot add or update a child row: a foreign key constraint fails 
(`gymsinhvien`.`admin_activity_logs`, CONSTRAINT `admin_activity_logs_ibfk_1` 
FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL)
```

**Vấn đề:** Foreign key đang tham chiếu đến `users` thay vì `admins`

---

## ✅ Giải pháp

### Cách 1: Chạy từng lệnh (Khuyến nghị)

Mở MySQL và chạy **từng lệnh một**:

```sql
-- 1. Tắt kiểm tra foreign key
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Xóa foreign key cũ
-- ⚠️ Nếu có lỗi "Unknown foreign key", BỎ QUA và chạy tiếp
ALTER TABLE `admin_activity_logs` 
DROP FOREIGN KEY `admin_activity_logs_ibfk_1`;

-- 3. Bật lại kiểm tra foreign key
SET FOREIGN_KEY_CHECKS = 1;

-- 4. Thêm foreign key đúng
ALTER TABLE `admin_activity_logs`
ADD CONSTRAINT `admin_activity_logs_ibfk_1` 
FOREIGN KEY (`user_id`) 
REFERENCES `admins` (`id`) 
ON DELETE CASCADE 
ON UPDATE CASCADE;
```

### Cách 2: Sử dụng Script

Chạy file: `database/FIX_FK_WORKING.sql`

**Lưu ý:** Chạy từng lệnh một, nếu có lỗi ở bước xóa foreign key thì bỏ qua và chạy tiếp.

---

## 🔍 Kiểm tra kết quả

Sau khi chạy, kiểm tra:

```sql
SELECT 
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'admin_activity_logs'
  AND CONSTRAINT_NAME = 'admin_activity_logs_ibfk_1';
```

**Kết quả đúng:**
- `REFERENCED_TABLE_NAME` = `admins` ✅
- `REFERENCED_COLUMN_NAME` = `id` ✅

**Kết quả sai (cần sửa):**
- `REFERENCED_TABLE_NAME` = `users` ❌

---

## 🚀 Sau khi sửa

1. **Restart server** (nếu đang chạy)
2. **Test lại API** tạo admin
3. Activity logs sẽ hoạt động bình thường

---

## ⚠️ Lưu ý

- MySQL không hỗ trợ `IF EXISTS` trong `DROP FOREIGN KEY`
- Nếu foreign key không tồn tại, sẽ có lỗi nhưng không ảnh hưởng
- Bỏ qua lỗi và chạy tiếp lệnh `ADD CONSTRAINT`

