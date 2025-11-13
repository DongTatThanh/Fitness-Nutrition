import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductView } from './product-view.entity';

@Injectable()
export class ProductViewService {
    constructor(
        @InjectRepository(ProductView)
        private productViewRepository: Repository<ProductView>,
    ) {}

    // Thêm sản phẩm vào lịch sử xem
    async addView(
        userId: number, 
        productId: number, 
        ipAddress?: string, 
        userAgent?: string
    ): Promise<ProductView> {
        // Kiểm tra xem user đã xem sản phẩm này chưa
        const existingView = await this.productViewRepository.findOne({
            where: { user_id: userId, product_id: productId }
        });

        if (existingView) {
            // Cập nhật thời gian xem và thông tin mới
            existingView.viewed_at = new Date();
            if (ipAddress) existingView.ip_address = ipAddress;
            if (userAgent) existingView.user_agent = userAgent;
            return await this.productViewRepository.save(existingView);
        }

        // Tạo mới
        const view = this.productViewRepository.create({
            user_id: userId,
            product_id: productId,
            ip_address: ipAddress,
            user_agent: userAgent,
        });

        return await this.productViewRepository.save(view);
    }

    // Lấy lịch sử xem của user (sắp xếp theo thời gian mới nhất)
    async getUserViewHistory(userId: number, limit: number = 20) {
        return await this.productViewRepository.find({
            where: { user_id: userId },
            relations: ['product', 'product.brand', 'product.category'],
            order: { viewed_at: 'DESC' },
            take: limit,
        });
    }

    // Xóa một sản phẩm khỏi lịch sử xem
    async removeView(userId: number, productId: number): Promise<void> {
        await this.productViewRepository.delete({
            user_id: userId,
            product_id: productId,
        });
    }

    // Xóa toàn bộ lịch sử xem của user
    async clearHistory(userId: number): Promise<void> {
        await this.productViewRepository.delete({ user_id: userId });
    }

    // Đếm số lượt xem của sản phẩm
    async getProductViewCount(productId: number): Promise<number> {
        return await this.productViewRepository.count({
            where: { product_id: productId }
        });
    }
}
