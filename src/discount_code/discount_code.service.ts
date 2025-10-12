import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DiscountCode } from '../entities/discount_code.entity';
import { InjectRepository } from '@nestjs/typeorm';


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
                created_at: 'DESC'
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
    async create(createDiscountCodeDto: any): Promise<DiscountCode> {
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

        const discountCode = this.discountCodeRepository.create(createDiscountCodeDto);
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
    async update(id: number, updateDiscountCodeDto: any): Promise<DiscountCode> {
        const discountCode = await this.discountCodeRepository.findOne({
            where: { id }
        });

        if (!discountCode) {
            throw new NotFoundException(`Mã giảm giá với ID ${id} không tồn tại`);
        }

        // Kiểm tra nếu update code và code mới đã tồn tại
        if (updateDiscountCodeDto.code && updateDiscountCodeDto.code !== discountCode.code) {
            const existingCode = await this.discountCodeRepository.findOne({
                where: { code: updateDiscountCodeDto.code }
            });

            if (existingCode) {
                throw new BadRequestException(`Mã giảm giá "${updateDiscountCodeDto.code}" đã tồn tại`);
            }
        }

        // Kiểm tra start_date và end_date nếu được cập nhật
        const startDate = updateDiscountCodeDto.start_date ? new Date(updateDiscountCodeDto.start_date) : discountCode.start_date;
        const endDate = updateDiscountCodeDto.end_date ? new Date(updateDiscountCodeDto.end_date) : discountCode.end_date;

        if (startDate >= endDate) {
            throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
        }

        Object.assign(discountCode, updateDiscountCodeDto);
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
}
