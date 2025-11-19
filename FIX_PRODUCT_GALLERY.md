# 🔧 SỬA LỖI GALLERY ẢNH - CHỈ HIỂN THỊ 1 ẢNH

## ❌ Vấn đề tìm thấy

Ở file **ProductDetail.tsx** dòng 257:

```tsx
const images = [product.featured_image, ...(product.image_gallery || [])].filter(Boolean);
```

**Code này SAI** vì:
- Chỉ lấy `image_gallery` (JSON field cũ)
- KHÔNG lấy `images` (relation ProductImage[] từ API)

## ✅ GIẢI PHÁP - Thay đổi dòng 257

### Cách 1: Ưu tiên relation `images` (KHUYẾN NGHỊ)

```tsx
// Ưu tiên relation images[], fallback về image_gallery JSON, cuối cùng là featured_image
const images = product.images && product.images.length > 0
  ? product.images.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(img => img.imageUrl)
  : (product.image_gallery && product.image_gallery.length > 0 
      ? [product.featured_image, ...product.image_gallery]
      : [product.featured_image]
    ).filter(Boolean);
```

**Giải thích:**
1. Nếu `product.images` có dữ liệu → Sort theo `sortOrder` → Lấy `imageUrl`
2. Nếu không → Fallback về `image_gallery` JSON
3. Nếu không có gì → Chỉ hiển thị `featured_image`

### Cách 2: Đơn giản hơn (nếu chắc chắn backend trả về `images`)

```tsx
const images = product.images?.map(img => img.imageUrl) || [product.featured_image];
```

---

## 📝 KIỂM TRA TYPE DEFINITION

Mở file **api-client.ts** hoặc **types.ts**, tìm interface `ProductDetailData`:

```tsx
export interface ProductDetailData {
  id: number;
  name: string;
  featured_image: string;
  image_gallery?: string[];  // JSON field cũ
  images?: ProductImage[];   // ← PHẢI CÓ DÒNG NÀY!
  // ... các field khác
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  productId: number;
  sortOrder: number;
}
```

**Nếu KHÔNG có `images?: ProductImage[];`** → Thêm vào!

---

## 🧪 TEST SAU KHI SỬA

### Bước 1: Chạy SQL trong database
```sql
DELETE FROM product_images WHERE productId = 1;

INSERT INTO product_images (productId, imageUrl, sortOrder) VALUES
(1, 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800', 0),
(1, 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=800', 1),
(1, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', 2),
(1, 'https://images.unsplash.com/photo-1594737625785-08d9610b447a?w=800', 3),
(1, 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800', 4);

SELECT * FROM product_images WHERE productId = 1;
```

### Bước 2: Test API trong Postman
```
GET http://localhost:3201/products/1
```

**Response phải có:**
```json
{
  "id": 1,
  "featured_image": "...",
  "images": [
    {"id": 1, "imageUrl": "https://...", "sortOrder": 0},
    {"id": 2, "imageUrl": "https://...", "sortOrder": 1},
    {"id": 3, "imageUrl": "https://...", "sortOrder": 2},
    {"id": 4, "imageUrl": "https://...", "sortOrder": 3},
    {"id": 5, "imageUrl": "https://...", "sortOrder": 4}
  ]
}
```

### Bước 3: Kiểm tra Frontend
1. Mở DevTools Console (F12)
2. Thêm log tạm trong ProductDetail.tsx:
```tsx
console.log('Product images:', product.images);
console.log('Images array for gallery:', images);
```
3. Reload trang sản phẩm
4. Kiểm tra console:
   - `product.images` phải có 5 phần tử
   - `images` array phải có 5 URLs

### Bước 4: Xem UI
- Text **"Gallery ảnh: (5 ảnh)"** thay vì "(1 ảnh)"
- Hiển thị 5 thumbnail ở dưới ảnh chính
- Click từng thumbnail → Ảnh chính thay đổi

---

## 🔍 DEBUG NÊU VẪN KHÔNG THẤY

### Kiểm tra 1: Backend có load relation `images` không?

Mở file `products.service.ts`, tìm method `findProductsId`:

```typescript
async findProductsId(id: number) {
  return await this.productRepository.findOne({
    where: { id },
    relations: [
      'brand', 
      'category', 
      'variants', 
      'reviews', 
      'attributes', 
      'images'  // ← PHẢI CÓ!
    ],
  });
}
```

**Nếu KHÔNG có `'images'`** → Thêm vào array `relations`!

### Kiểm tra 2: API Response structure

Nếu API trả về `images` nhưng structure khác:

```json
// Có thể là:
"images": [{"imageUrl": "..."}, ...]

// Hoặc:
"gallery_images": ["url1", "url2", ...]

// Hoặc:
"image_gallery": ["url1", "url2", ...]
```

Sửa code frontend theo structure thực tế!

### Kiểm tra 3: CORS / Network Error

Mở DevTools → Tab Network → Xem request `GET /products/1`:
- Status: 200 OK
- Response có `images` array không?
- Có lỗi CORS không?

---

## 📦 TÓM TẮT NHANH

1. **Mở file ProductDetail.tsx**
2. **Tìm dòng 257**: `const images = [product.featured_image, ...(product.image_gallery || [])].filter(Boolean);`
3. **Thay bằng**:
```tsx
const images = product.images && product.images.length > 0
  ? product.images.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(img => img.imageUrl)
  : [product.featured_image];
```
4. **Lưu file**
5. **Reload trang** → Xem Gallery có 5 ảnh!

---

## ✨ Kết quả mong đợi

**TRƯỚC KHI SỬA:**
```
Gallery ảnh: (1 ảnh)
[ảnh 1]
```

**SAU KHI SỬA:**
```
Gallery ảnh: (5 ảnh)
[ảnh 1] [ảnh 2] [ảnh 3] [ảnh 4] [ảnh 5]
```

Click vào thumbnail → Ảnh chính thay đổi! ✅
