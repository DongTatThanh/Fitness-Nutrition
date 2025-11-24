import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InventoryTransaction, TransactionType, ReferenceType } from './inventory-transaction.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryTransaction)
    private inventoryRepository: Repository<InventoryTransaction>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantsRepository: Repository<ProductVariant>,
  ) {}

  // Tạo giao dịch kho và tự động cập nhật tồn kho
  async createTransaction(
    dto: CreateInventoryTransactionDto,
    createdBy?: number,
  ) {
    // Kiểm tra sản phẩm tồn tại
    const product = await this.productsRepository.findOne({
      where: { id: dto.product_id },
    });

    if (!product) {
      throw new NotFoundException(`Sản phẩm với ID ${dto.product_id} không tồn tại`);
    }

    // Nếu có variant, kiểm tra variant tồn tại
    let variant: ProductVariant | null = null;
    if (dto.variant_id) {
      variant = await this.variantsRepository.findOne({
        where: { id: dto.variant_id, product_id: dto.product_id },
      });

      if (!variant) {
        throw new NotFoundException(`Variant với ID ${dto.variant_id} không tồn tại`);
      }
    }

    // Tính tổng giá trị nếu chưa có
    let totalCost = dto.total_cost;
    if (!totalCost && dto.unit_cost && dto.quantity) {
      totalCost = Number(dto.unit_cost) * Math.abs(dto.quantity);
    }

    // Lấy tồn kho hiện tại
    const currentStock = variant
      ? variant.inventory_quantity
      : product.inventory_quantity;

    // Tính tồn kho sau giao dịch
    let balanceAfter = currentStock;
    if (dto.transaction_type === TransactionType.PURCHASE || 
        dto.transaction_type === TransactionType.RETURN) {
      balanceAfter = currentStock + Math.abs(dto.quantity);
    } else if (dto.transaction_type === TransactionType.SALE ||
               dto.transaction_type === TransactionType.DAMAGE) {
      balanceAfter = currentStock - Math.abs(dto.quantity);
    } else if (dto.transaction_type === TransactionType.ADJUSTMENT) {
      // Điều chỉnh: quantity có thể dương (tăng) hoặc âm (giảm)
      balanceAfter = currentStock + dto.quantity;
    }

    // Kiểm tra tồn kho âm (trừ khi là điều chỉnh)
    if (balanceAfter < 0 && dto.transaction_type !== TransactionType.ADJUSTMENT) {
      throw new BadRequestException(
        `Tồn kho không đủ. Tồn kho hiện tại: ${currentStock}, yêu cầu: ${Math.abs(dto.quantity)}`,
      );
    }

    // Tạo giao dịch
    const transaction = this.inventoryRepository.create({
      ...dto,
      total_cost: totalCost,
      created_by: createdBy,
      balance_after: balanceAfter,
    });

    const saved = await this.inventoryRepository.save(transaction);

    // Cập nhật tồn kho
    if (variant) {
      variant.inventory_quantity = balanceAfter;
      await this.variantsRepository.save(variant);
    } else {
      product.inventory_quantity = balanceAfter;
      await this.productsRepository.save(product);
    }

    return {
      success: true,
      message: 'Tạo giao dịch kho thành công',
      data: saved,
    };
  }

  // Lấy lịch sử giao dịch kho
  async getTransactions(
    page: number = 1,
    limit: number = 20,
    productId?: number,
    variantId?: number,
    transactionType?: TransactionType,
    startDate?: string,
    endDate?: string,
  ) {
    const query = this.inventoryRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.product', 'product')
      .leftJoinAndSelect('transaction.variant', 'variant')
      .orderBy('transaction.created_at', 'DESC');

    if (productId) {
      query.andWhere('transaction.product_id = :productId', { productId });
    }

    if (variantId) {
      query.andWhere('transaction.variant_id = :variantId', { variantId });
    }

    if (transactionType) {
      query.andWhere('transaction.transaction_type = :transactionType', {
        transactionType,
      });
    }

    if (startDate && endDate) {
      query.andWhere('transaction.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000), // +1 day
      });
    }

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Lấy chi tiết giao dịch
  async getTransaction(id: number) {
    const transaction = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['product', 'variant'],
    });

    if (!transaction) {
      throw new NotFoundException(`Giao dịch với ID ${id} không tồn tại`);
    }

    return transaction;
  }

  // Lấy báo cáo tồn kho
  async getInventoryReport(productId?: number) {
    const query = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.track_inventory = 1');

    if (productId) {
      query.andWhere('product.id = :productId', { productId });
    }

    const products = await query.getMany();

    return products.map((product) => ({
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      current_stock: product.inventory_quantity,
      low_stock_threshold: product.low_stock_threshold,
      is_low_stock:
        product.low_stock_threshold &&
        product.inventory_quantity <= product.low_stock_threshold,
      variants: product.variants?.map((variant) => ({
        variant_id: variant.id,
        variant_name: variant.variant_name,
        current_stock: variant.inventory_quantity,
      })),
    }));
  }

  // Điều chỉnh tồn kho thủ công
  async adjustInventory(
    productId: number,
    quantity: number, // Có thể dương (tăng) hoặc âm (giảm)
    notes?: string,
    variantId?: number,
    createdBy?: number,
  ) {
    const dto: CreateInventoryTransactionDto = {
      product_id: productId,
      variant_id: variantId || null,
      transaction_type: TransactionType.ADJUSTMENT,
      quantity: quantity, // Giữ nguyên dấu
      notes: notes || 'Điều chỉnh tồn kho thủ công',
    };

    return this.createTransaction(dto, createdBy);
  }
}

