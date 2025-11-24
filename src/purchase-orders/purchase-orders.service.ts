import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseOrder, PurchaseOrderStatus } from './purchase-order.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { InventoryTransaction, TransactionType, ReferenceType } from '../inventory/inventory-transaction.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { AddItemDto } from './dto/add-item.dto';
import { ReceiveItemDto } from './dto/receive-item.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrdersRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemsRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantsRepository: Repository<ProductVariant>,
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
    @InjectRepository(InventoryTransaction)
    private inventoryRepository: Repository<InventoryTransaction>,
    private inventoryService: InventoryService,
    private dataSource: DataSource,
  ) {}

  // Tạo mã đơn nhập hàng tự động
  private generateOrderNumber(): string {
    const prefix = 'PO';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  // Lấy danh sách đơn nhập hàng
  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: PurchaseOrderStatus,
    supplierId?: number,
  ) {
    const query = this.purchaseOrdersRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.variant', 'variant')
      .orderBy('po.created_at', 'DESC');

    if (status) {
      query.andWhere('po.status = :status', { status });
    }

    if (supplierId) {
      query.andWhere('po.supplier_id = :supplierId', { supplierId });
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

  // Lấy chi tiết đơn nhập hàng
  async findOne(id: number) {
    const order = await this.purchaseOrdersRepository.findOne({
      where: { id },
      relations: ['supplier', 'items', 'items.product', 'items.variant'],
    });

    if (!order) {
      throw new NotFoundException(`Đơn nhập hàng với ID ${id} không tồn tại`);
    }

    return order;
  }

  // Tạo đơn nhập hàng mới
  async create(dto: CreatePurchaseOrderDto, createdBy?: number) {
    // Kiểm tra supplier nếu có
    if (dto.supplier_id) {
      const supplier = await this.suppliersRepository.findOne({
        where: { id: dto.supplier_id },
      });
      if (!supplier) {
        throw new NotFoundException(
          `Nhà cung cấp với ID ${dto.supplier_id} không tồn tại`,
        );
      }
    }

    // Validate và tính tổng tiền
    let totalAmount = 0;
    const items: PurchaseOrderItem[] = [];

    for (const itemDto of dto.items) {
      // Kiểm tra sản phẩm tồn tại
      const product = await this.productsRepository.findOne({
        where: { id: itemDto.product_id },
      });

      if (!product) {
        throw new NotFoundException(
          `Sản phẩm với ID ${itemDto.product_id} không tồn tại`,
        );
      }

      // Kiểm tra variant nếu có
      if (itemDto.variant_id) {
        const variant = await this.variantsRepository.findOne({
          where: { id: itemDto.variant_id, product_id: itemDto.product_id },
        });

        if (!variant) {
          throw new NotFoundException(
            `Variant với ID ${itemDto.variant_id} không tồn tại`,
          );
        }
      }

      const itemTotal = Number(itemDto.unit_cost) * itemDto.quantity_ordered;
      totalAmount += itemTotal;

      const item = this.purchaseOrderItemsRepository.create({
        product_id: itemDto.product_id,
        variant_id: itemDto.variant_id || null,
        quantity_ordered: itemDto.quantity_ordered,
        quantity_received: 0,
        unit_cost: itemDto.unit_cost,
        total_cost: itemTotal,
        notes: itemDto.notes || null,
      });

      items.push(item);
    }

    // Tạo đơn nhập hàng
    const order = this.purchaseOrdersRepository.create({
      supplier_id: dto.supplier_id || null,
      order_number: this.generateOrderNumber(),
      status: PurchaseOrderStatus.DRAFT,
      total_amount: totalAmount,
      notes: dto.notes || null,
      expected_delivery_date: dto.expected_delivery_date
        ? new Date(dto.expected_delivery_date)
        : null,
      created_by: createdBy || null,
      items,
    });

    const saved = await this.purchaseOrdersRepository.save(order);

    return {
      success: true,
      message: 'Tạo đơn nhập hàng thành công',
      data: saved,
    };
  }

  // Cập nhật đơn nhập hàng
  async update(id: number, dto: UpdatePurchaseOrderDto) {
    const order = await this.purchaseOrdersRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Đơn nhập hàng với ID ${id} không tồn tại`);
    }

    // Không cho phép cập nhật nếu đã nhận hàng hoặc đã hủy
    if (
      order.status === PurchaseOrderStatus.RECEIVED ||
      order.status === PurchaseOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Không thể cập nhật đơn nhập hàng đã nhận hàng hoặc đã hủy',
      );
    }

    // Kiểm tra supplier nếu có
    if (dto.supplier_id) {
      const supplier = await this.suppliersRepository.findOne({
        where: { id: dto.supplier_id },
      });
      if (!supplier) {
        throw new NotFoundException(
          `Nhà cung cấp với ID ${dto.supplier_id} không tồn tại`,
        );
      }
    }

    Object.assign(order, {
      ...dto,
      supplier_id: dto.supplier_id !== undefined ? dto.supplier_id : order.supplier_id,
      received_date: dto.received_date
        ? new Date(dto.received_date)
        : order.received_date,
      expected_delivery_date: dto.expected_delivery_date
        ? new Date(dto.expected_delivery_date)
        : order.expected_delivery_date,
    });

    const updated = await this.purchaseOrdersRepository.save(order);

    return {
      success: true,
      message: 'Cập nhật đơn nhập hàng thành công',
      data: updated,
    };
  }

  // Duyệt đơn nhập hàng
  async approve(id: number) {
    const order = await this.purchaseOrdersRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Đơn nhập hàng với ID ${id} không tồn tại`);
    }

    if (order.status !== PurchaseOrderStatus.DRAFT &&
        order.status !== PurchaseOrderStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể duyệt đơn nhập hàng ở trạng thái DRAFT hoặc PENDING',
      );
    }

    order.status = PurchaseOrderStatus.APPROVED;
    const updated = await this.purchaseOrdersRepository.save(order);

    return {
      success: true,
      message: 'Duyệt đơn nhập hàng thành công',
      data: updated,
    };
  }

  // Nhận hàng (từng item)
  async receiveItem(
    orderId: number,
    itemId: number,
    dto: ReceiveItemDto,
    createdBy?: number,
  ) {
    const order = await this.purchaseOrdersRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Đơn nhập hàng với ID ${orderId} không tồn tại`);
    }

    if (order.status !== PurchaseOrderStatus.APPROVED) {
      throw new BadRequestException(
        'Chỉ có thể nhận hàng khi đơn nhập hàng đã được duyệt',
      );
    }

    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(
        `Item với ID ${itemId} không tồn tại trong đơn nhập hàng`,
      );
    }

    const quantityReceived = dto.quantity_received;
    const newReceived = item.quantity_received + quantityReceived;

    if (newReceived > item.quantity_ordered) {
      throw new BadRequestException(
        `Số lượng nhận (${newReceived}) không được vượt quá số lượng đặt (${item.quantity_ordered})`,
      );
    }

    // Cập nhật số lượng nhận
    item.quantity_received = newReceived;
    await this.purchaseOrderItemsRepository.save(item);

    // Tạo giao dịch kho
    await this.inventoryService.createTransaction(
      {
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        transaction_type: TransactionType.PURCHASE,
        quantity: quantityReceived,
        unit_cost: Number(item.unit_cost),
        total_cost: Number(item.unit_cost) * quantityReceived,
        reference_type: ReferenceType.PURCHASE_ORDER,
        reference_id: orderId,
        notes: `Nhận hàng từ đơn nhập hàng ${order.order_number}`,
      },
      createdBy,
    );

    // Kiểm tra xem đã nhận đủ tất cả items chưa
    const allReceived = order.items.every(
      (i) => i.quantity_received >= i.quantity_ordered,
    );

    if (allReceived) {
      order.status = PurchaseOrderStatus.RECEIVED;
      order.received_date = new Date();
      await this.purchaseOrdersRepository.save(order);
    }

    return {
      success: true,
      message: 'Nhận hàng thành công',
      data: {
        item,
        order_status: order.status,
      },
    };
  }

  // Nhận toàn bộ hàng
  async receiveAll(orderId: number, createdBy?: number) {
    const order = await this.purchaseOrdersRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Đơn nhập hàng với ID ${orderId} không tồn tại`);
    }

    if (order.status !== PurchaseOrderStatus.APPROVED) {
      throw new BadRequestException(
        'Chỉ có thể nhận hàng khi đơn nhập hàng đã được duyệt',
      );
    }

    // Sử dụng transaction để đảm bảo tính nhất quán
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of order.items) {
        const remaining = item.quantity_ordered - item.quantity_received;
        if (remaining > 0) {
          // Cập nhật số lượng nhận
          item.quantity_received = item.quantity_ordered;
          await queryRunner.manager.save(item);

          // Tạo giao dịch kho
          const transaction = queryRunner.manager.create(InventoryTransaction, {
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            transaction_type: TransactionType.PURCHASE,
            quantity: remaining,
            unit_cost: Number(item.unit_cost),
            total_cost: Number(item.unit_cost) * remaining,
            reference_type: ReferenceType.PURCHASE_ORDER,
            reference_id: orderId,
            notes: `Nhận hàng từ đơn nhập hàng ${order.order_number}`,
            created_by: createdBy || null,
          });

          await queryRunner.manager.save(transaction);

          // Cập nhật tồn kho
          if (item.variant_id) {
            const variant = await queryRunner.manager.findOne(ProductVariant, {
              where: { id: item.variant_id },
            });
            if (variant) {
              variant.inventory_quantity += remaining;
              await queryRunner.manager.save(variant);
            }
          } else {
            const product = await queryRunner.manager.findOne(Product, {
              where: { id: item.product_id },
            });
            if (product) {
              product.inventory_quantity += remaining;
              await queryRunner.manager.save(product);
            }
          }
        }
      }

      // Cập nhật trạng thái đơn hàng
      order.status = PurchaseOrderStatus.RECEIVED;
      order.received_date = new Date();
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Nhận toàn bộ hàng thành công',
        data: order,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Hủy đơn nhập hàng
  async cancel(id: number) {
    const order = await this.purchaseOrdersRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Đơn nhập hàng với ID ${id} không tồn tại`);
    }

    if (order.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('Không thể hủy đơn nhập hàng đã nhận hàng');
    }

    order.status = PurchaseOrderStatus.CANCELLED;
    const updated = await this.purchaseOrdersRepository.save(order);

    return {
      success: true,
      message: 'Hủy đơn nhập hàng thành công',
      data: updated,
    };
  }

  // Thêm item vào đơn nhập hàng
  async addItem(orderId: number, dto: AddItemDto) {
    const order = await this.purchaseOrdersRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Đơn nhập hàng với ID ${orderId} không tồn tại`);
    }

    if (
      order.status === PurchaseOrderStatus.RECEIVED ||
      order.status === PurchaseOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Không thể thêm item vào đơn nhập hàng đã nhận hàng hoặc đã hủy',
      );
    }

    // Kiểm tra sản phẩm
    const product = await this.productsRepository.findOne({
      where: { id: dto.product_id },
    });

    if (!product) {
      throw new NotFoundException(
        `Sản phẩm với ID ${dto.product_id} không tồn tại`,
      );
    }

    // Kiểm tra variant nếu có
    if (dto.variant_id) {
      const variant = await this.variantsRepository.findOne({
        where: { id: dto.variant_id, product_id: dto.product_id },
      });

      if (!variant) {
        throw new NotFoundException(
          `Variant với ID ${dto.variant_id} không tồn tại`,
        );
      }
    }

    const itemTotal = Number(dto.unit_cost) * dto.quantity_ordered;

    const item = this.purchaseOrderItemsRepository.create({
      purchase_order_id: orderId,
      product_id: dto.product_id,
      variant_id: dto.variant_id || null,
      quantity_ordered: dto.quantity_ordered,
      quantity_received: 0,
      unit_cost: dto.unit_cost,
      total_cost: itemTotal,
      notes: dto.notes || null,
    });

    const saved = await this.purchaseOrderItemsRepository.save(item);

    // Cập nhật tổng tiền đơn hàng
    order.total_amount = Number(order.total_amount) + itemTotal;
    await this.purchaseOrdersRepository.save(order);

    return {
      success: true,
      message: 'Thêm item vào đơn nhập hàng thành công',
      data: saved,
    };
  }

  // Xóa item khỏi đơn nhập hàng
  async removeItem(orderId: number, itemId: number) {
    const order = await this.purchaseOrdersRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Đơn nhập hàng với ID ${orderId} không tồn tại`);
    }

    if (
      order.status === PurchaseOrderStatus.RECEIVED ||
      order.status === PurchaseOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Không thể xóa item khỏi đơn nhập hàng đã nhận hàng hoặc đã hủy',
      );
    }

    const item = await this.purchaseOrderItemsRepository.findOne({
      where: { id: itemId, purchase_order_id: orderId },
    });

    if (!item) {
      throw new NotFoundException(
        `Item với ID ${itemId} không tồn tại trong đơn nhập hàng`,
      );
    }

    // Cập nhật tổng tiền đơn hàng
    order.total_amount = Number(order.total_amount) - Number(item.total_cost);
    await this.purchaseOrdersRepository.save(order);

    // Xóa item
    await this.purchaseOrderItemsRepository.remove(item);

    return {
      success: true,
      message: 'Xóa item khỏi đơn nhập hàng thành công',
    };
  }
}

