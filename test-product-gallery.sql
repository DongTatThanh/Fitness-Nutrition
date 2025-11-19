-- Script test: Thêm gallery ảnh cho sản phẩm
-- Chạy script này trong MySQL Workbench hoặc phpMyAdmin

-- Bước 1: Tìm ID sản phẩm cần test (thay YOUR_PRODUCT_ID)
SELECT id, name, featured_image FROM products LIMIT 5;

-- Bước 2: Xóa ảnh cũ của sản phẩm (nếu có)
-- DELETE FROM product_images WHERE productId = YOUR_PRODUCT_ID;

-- Bước 3: Thêm nhiều ảnh gallery cho sản phẩm (thay YOUR_PRODUCT_ID bằng ID thực tế)
-- Ví dụ: Nếu sản phẩm có ID = 1

-- Xóa ảnh cũ
DELETE FROM product_images WHERE productId = 1;

-- Thêm 5 ảnh mới
INSERT INTO product_images (productId, imageUrl, sortOrder) VALUES
(1, 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800', 0),
(1, 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=800', 1),
(1, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', 2),
(1, 'https://images.unsplash.com/photo-1594737625785-08d9610b447a?w=800', 3),
(1, 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800', 4);

-- Kiểm tra kết quả
SELECT * FROM product_images WHERE productId = 1 ORDER BY sortOrder;

-- Cập nhật featured_image cho sản phẩm
UPDATE products 
SET featured_image = 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800'
WHERE id = 1;

-- Kiểm tra sản phẩm đã có ảnh
SELECT id, name, featured_image, 
       (SELECT COUNT(*) FROM product_images WHERE productId = products.id) as total_images
FROM products 
WHERE id = 1;
