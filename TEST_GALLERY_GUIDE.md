# 🧪 HƯỚNG DẪN TEST GALLERY ẢNH SẢN PHẨM

## 📋 Mục đích
Test xem API có trả về đầy đủ gallery ảnh không và frontend có hiển thị được nhiều ảnh không.

---

## 🔧 CÁCH 1: Thêm dữ liệu trực tiếp vào Database (NHANH NHẤT)

### Bước 1: Mở MySQL Workbench hoặc phpMyAdmin
Kết nối vào database `gymsinhvien`

### Bước 2: Chạy SQL sau để thêm ảnh cho sản phẩm ID=1

```sql
-- Xóa ảnh cũ (nếu có)
DELETE FROM product_images WHERE productId = 1;

-- Thêm 5 ảnh mới
INSERT INTO product_images (productId, imageUrl, sortOrder) VALUES
(1, 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800', 0),
(1, 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=800', 1),
(1, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', 2),
(1, 'https://images.unsplash.com/photo-1594737625785-08d9610b447a?w=800', 3),
(1, 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800', 4);

-- Kiểm tra đã thêm thành công chưa
SELECT * FROM product_images WHERE productId = 1 ORDER BY sortOrder;
```

### Bước 3: Test API trong Postman

#### 🔹 Test 1: GET Product Detail (User)
```
GET http://localhost:3201/products/1
```

**Kết quả mong đợi:**
```json
{
  "id": 1,
  "name": "...",
  "featured_image": "...",
  "images": [
    {
      "id": 1,
      "imageUrl": "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800",
      "sortOrder": 0
    },
    {
      "id": 2,
      "imageUrl": "https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=800",
      "sortOrder": 1
    },
    ... (total 5 images)
  ]
}
```

#### 🔹 Test 2: GET Product Detail (Admin)
```
GET http://localhost:3201/products/admin/1
```

**Kết quả mong đợi:**
```json
{
  "id": 1,
  "name": "...",
  "featured_image": "...",
  "gallery_images": [
    "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800",
    "https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=800",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    "https://images.unsplash.com/photo-1594737625785-08d9610b447a?w=800",
    "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800"
  ],
  "images": [
    ... (array đầy đủ với object)
  ]
}
```

### Bước 4: Kiểm tra trên Frontend
1. Mở trang sản phẩm: `http://localhost:3000/products/1` (hoặc trang của bạn)
2. Kiểm tra phần **Gallery ảnh: (5 ảnh)** ở dưới ảnh chính
3. Click vào từng ảnh thumbnail để xem có đổi ảnh chính không

---

## 🔧 CÁCH 2: Test qua API Postman (Tạo sản phẩm mới)

### Bước 1: Import Postman Collection
1. Mở Postman
2. Click **Import**
3. Chọn file: `Product_Gallery_Test.postman_collection.json`

### Bước 2: Chạy Request "3. Create Product with Gallery"
```
POST http://localhost:3201/products/admin
Content-Type: application/json

Body đã có sẵn trong collection
```

### Bước 3: Copy ID sản phẩm vừa tạo
Từ response, copy giá trị `id` (ví dụ: 50)

### Bước 4: Test GET product với ID vừa tạo
```
GET http://localhost:3201/products/50
GET http://localhost:3201/products/admin/50
```

---

## ✅ CHECKLIST Kết quả mong đợi

- [ ] API `GET /products/:id` trả về `images` array với 5 phần tử
- [ ] API `GET /products/admin/:id` trả về `gallery_images` array với 5 URLs
- [ ] Frontend hiển thị text **"Gallery ảnh: (5 ảnh)"** thay vì "(3 ảnh)"
- [ ] Frontend hiển thị 5 thumbnail ảnh nhỏ dưới ảnh chính
- [ ] Click vào thumbnail thì ảnh chính thay đổi
- [ ] Modal "Chi tiết sản phẩm" hiển thị đầy đủ 5 ảnh trong gallery

---

## 🐛 Nếu không thấy ảnh

### Kiểm tra 1: Database có dữ liệu chưa?
```sql
SELECT p.id, p.name, 
       COUNT(pi.id) as total_images
FROM products p
LEFT JOIN product_images pi ON pi.productId = p.id
WHERE p.id = 1
GROUP BY p.id;
```

Kết quả phải là `total_images = 5`

### Kiểm tra 2: API có load relation "images" không?
Mở file `products.service.ts`, tìm method `findProductsId`:
```typescript
relations: ['brand', 'category', 'variants', 'reviews', 'attributes', 'images']
```
Phải có `'images'` trong array!

### Kiểm tra 3: Frontend có render gallery không?
Kiểm tra console log trong browser:
```javascript
console.log('Product images:', product.images);
console.log('Gallery images:', product.gallery_images);
```

---

## 📸 Danh sách URL ảnh test khác (nếu cần thay đổi)

```javascript
// Fitness supplements
"https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800"  // Whey
"https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=800"  // Bottles
"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800"  // Powder
"https://images.unsplash.com/photo-1594737625785-08d9610b447a?w=800"  // BCAA
"https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800"  // Pre-workout
"https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=800"  // Gainer
"https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=800"  // Creatine
"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"     // Vitamin
```

---

## 🎯 Tóm tắt nhanh

1. **Chạy SQL** trong file `test-product-gallery.sql`
2. **Test Postman**: `GET http://localhost:3201/products/1`
3. **Kiểm tra response** có array `images` với 5 phần tử
4. **Mở frontend** xem gallery có hiển thị 5 ảnh không

✨ Xong! Nếu vẫn không thấy, inbox cho tôi kết quả response từ Postman.
