import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DiscountCode } from '../entities/discount_code.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { UpdateDiscountCodeDto } from './dto/update-discount-code.dto';


@Injectable()
export class DiscountCodeService {
    constructor(
        @InjectRepository(DiscountCode)
        private readonly discountCodeRepository: Repository<DiscountCode>,
    ) {}

    // Lấy danh sách tất cả mã giảm giá
    async findAll(): Promise<DiscountCode[]> {
        return await this.discountCodeRepository.find({
            order: {
                created_at: 'DESC'   /// sắp xêp theo thứ tự tăng dần cũ mới ....
            }
        });
    }

    // Lấy danh sách mã giảm giá còn hiệu lực
    async findActiveDiscountCodes(): Promise<DiscountCode[]> {
        const now = new Date();
        return await this.discountCodeRepository.createQueryBuilder('discount')
            .where('discount.start_date <= :now', { now })
            .andWhere('discount.end_date >= :now', { now })
            .andWhere('discount.is_active = :isActive', { isActive: 1 })
            .andWhere('(discount.usage_limit IS NULL OR discount.used_count < discount.usage_limit)')
            .orderBy('discount.created_at', 'DESC')
            .getMany();
    }

    // Tìm mã giảm giá theo code
    async findByCode(code: string): Promise<DiscountCode> {
        const discountCode = await this.discountCodeRepository.findOne({
            where: { code }
        });

        if (!discountCode) {
            throw new NotFoundException(`Mã giảm giá "${code}" không tồn tại`);
        }

        return discountCode;
    }

    // Tạo mã giảm giá mới
    async create(createDiscountCodeDto: CreateDiscountCodeDto): Promise<DiscountCode> {
        // Kiểm tra mã đã tồn tại chưa
        const existingCode = await this.discountCodeRepository.findOne({
            where: { code: createDiscountCodeDto.code }
        });

        if (existingCode) {
            throw new BadRequestException(`Mã giảm giá "${createDiscountCodeDto.code}" đã tồn tại`);
        }

        // Kiểm tra start_date phải nhỏ hơn end_date
        if (new Date(createDiscountCodeDto.start_date) >= new Date(createDiscountCodeDto.end_date)) {
            throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
        }

        // Map DTO fields to entity fields
        const discountCode = this.discountCodeRepository.create({
            code: createDiscountCodeDto.code,
            name: createDiscountCodeDto.name,
            description: createDiscountCodeDto.description,
            type: createDiscountCodeDto.discount_type, // map discount_type -> type
            value: createDiscountCodeDto.discount_value, // map discount_value -> value
            minimum_order_amount: createDiscountCodeDto.min_order_value, // map min_order_value -> minimum_order_amount
            maximum_discount_amount: createDiscountCodeDto.max_discount_amount,
            usage_limit: createDiscountCodeDto.usage_limit,
            usage_limit_per_customer: createDiscountCodeDto.usage_limit_per_customer,
            start_date: createDiscountCodeDto.start_date,
            end_date: createDiscountCodeDto.end_date,
            applicable_to: createDiscountCodeDto.applicable_type, // map applicable_type -> applicable_to
            applicable_items: createDiscountCodeDto.applicable_items,
            is_active: createDiscountCodeDto.is_active ?? true,
            image: createDiscountCodeDto.image_url, // map image_url -> image
        });
        
        const saved = await this.discountCodeRepository.save(discountCode) as any as DiscountCode;
        return saved;
    }

    // Validate và sử dụng mã giảm giá
    async validateAndUseCode(code: string): Promise<{ valid: boolean; discountValue?: number; discountType?: string; message?: string }> {
        const discountCode = await this.discountCodeRepository.findOne({
            where: { code }
        });

        if (!discountCode) {
            return {
                valid: false,
                message: 'Mã giảm giá không tồn tại'
            };
        }

        // Kiểm tra mã có active không
        if (!discountCode.is_active) {
            return {
                valid: false,
                message: 'Mã giảm giá đã bị vô hiệu hóa'
            };
        }

        const now = new Date();

        // Kiểm tra thời gian hiệu lực
        if (now < new Date(discountCode.start_date)) {
            return {
                valid: false,
                message: 'Mã giảm giá chưa có hiệu lực'
            };
        }

        if (now > new Date(discountCode.end_date)) {
            return {
                valid: false,
                message: 'Mã giảm giá đã hết hạn'
            };
        }

        // Kiểm tra số lần sử dụng
        if (discountCode.usage_limit !== null && discountCode.used_count >= discountCode.usage_limit) {
            return {
                valid: false,
                message: 'Mã giảm giá đã hết lượt sử dụng'
            };
        }

        // Tăng số lần sử dụng
        discountCode.used_count += 1;
        await this.discountCodeRepository.save(discountCode);

        return {
            valid: true,
            discountValue: discountCode.value,
            discountType: discountCode.type,
            message: `Áp dụng mã giảm giá "${discountCode.name}" thành công`
        };
    }

    // Cập nhật mã giảm giá
    async update(id: number, updateDiscountCodeDto: UpdateDiscountCodeDto): Promise<DiscountCode> {
        const discountCode = await this.discountCodeRepository.findOne({
            where: { id }
        });

        if (!discountCode) {
            throw new NotFoundException(`Mã giảm giá với ID ${id} không tồn tại`);
        }

        // Kiểm tra nếu update code và code mới đã tồn tại (nếu có trong DTO)
        const codeFromDto = (updateDiscountCodeDto as any).code;
        if (codeFromDto && codeFromDto !== discountCode.code) {
            const existingCode = await this.discountCodeRepository.findOne({
                where: { code: codeFromDto }
            });

            if (existingCode) {
                throw new BadRequestException(`Mã giảm giá "${codeFromDto}" đã tồn tại`);
            }
        }

        // Kiểm tra start_date và end_date nếu được cập nhật
        const startDateFromDto = (updateDiscountCodeDto as any).start_date;
        const endDateFromDto = (updateDiscountCodeDto as any).end_date;
        const startDate = startDateFromDto ? new Date(startDateFromDto) : discountCode.start_date;
        const endDate = endDateFromDto ? new Date(endDateFromDto) : discountCode.end_date;

        if (startDate >= endDate) {
            throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
        }

        // Only update fields that are provided in the DTO
        if (updateDiscountCodeDto.code !== undefined) {
            discountCode.code = updateDiscountCodeDto.code;
        }
        if (updateDiscountCodeDto.name !== undefined) {
            discountCode.name = updateDiscountCodeDto.name;
        }
        if (updateDiscountCodeDto.description !== undefined) {
            discountCode.description = updateDiscountCodeDto.description;
        }
        if (updateDiscountCodeDto.discount_type !== undefined) {
            discountCode.type = updateDiscountCodeDto.discount_type;
        }
        if (updateDiscountCodeDto.discount_value !== undefined) {
            discountCode.value = updateDiscountCodeDto.discount_value;
        }
        if (updateDiscountCodeDto.min_order_value !== undefined) {
            discountCode.minimum_order_amount = updateDiscountCodeDto.min_order_value;
        }
        if (updateDiscountCodeDto.max_discount_amount !== undefined) {
            discountCode.maximum_discount_amount = updateDiscountCodeDto.max_discount_amount;
        }
        if (updateDiscountCodeDto.usage_limit !== undefined) {
            discountCode.usage_limit = updateDiscountCodeDto.usage_limit;
        }
        if (updateDiscountCodeDto.usage_limit_per_customer !== undefined) {
            discountCode.usage_limit_per_customer = updateDiscountCodeDto.usage_limit_per_customer;
        }
        if (updateDiscountCodeDto.start_date !== undefined) {
            discountCode.start_date = updateDiscountCodeDto.start_date;
        }
        if (updateDiscountCodeDto.end_date !== undefined) {
            discountCode.end_date = updateDiscountCodeDto.end_date;
        }
        if (updateDiscountCodeDto.applicable_type !== undefined) {
            discountCode.applicable_to = updateDiscountCodeDto.applicable_type;
        }
        if (updateDiscountCodeDto.applicable_items !== undefined) {
            discountCode.applicable_items = updateDiscountCodeDto.applicable_items;
        }
        if (updateDiscountCodeDto.is_active !== undefined) {
            discountCode.is_active = updateDiscountCodeDto.is_active;
        }
        if (updateDiscountCodeDto.image_url !== undefined) {
            discountCode.image = updateDiscountCodeDto.image_url;
        }
        
        return await this.discountCodeRepository.save(discountCode);
    }

    // Xóa mã giảm giá (soft delete - set is_active = false)
    async remove(id: number): Promise<{ message: string }> {
        const discountCode = await this.discountCodeRepository.findOne({
            where: { id }
        });

        if (!discountCode) {
            throw new NotFoundException(`Mã giảm giá với ID ${id} không tồn tại`);
        }

        discountCode.is_active = false;
        await this.discountCodeRepository.save(discountCode);

        return {
            message: `Đã vô hiệu hóa mã giảm giá "${discountCode.code}"`
        };
    }

    // Hard delete - xóa hoàn toàn
    async hardDelete(id: number): Promise<{ message: string }> {
        const discountCode = await this.discountCodeRepository.findOne({
            where: { id }
        });

        if (!discountCode) {
            throw new NotFoundException(`Mã giảm giá với ID ${id} không tồn tại`);
        }

        await this.discountCodeRepository.remove(discountCode);

        return {
            message: `Đã xóa hoàn toàn mã giảm giá "${discountCode.code}"`
        };
    }

    // Cập nhật ảnh cho mã giảm giá
    async updateDiscountCodeImage(id: number, imageUrl: string): Promise<DiscountCode> {
        const discountCode = await this.discountCodeRepository.findOne({
            where: { id }
        });

        if (!discountCode) {
            throw new NotFoundException(`Mã giảm giá với ID ${id} không tồn tại`);
        }

        discountCode.image = imageUrl;
        return await this.discountCodeRepository.save(discountCode);
    }
}
