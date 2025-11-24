import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipping, ShippingStatus } from './shipping.entity';
import { Order } from '../orders/order.entity';
import { CreateShippingDto } from './dto/create-shipping.dto';
import { UpdateShippingDto } from './dto/update-shipping.dto';

@Injectable()
export class ShippingsService {
  constructor(
    @InjectRepository(Shipping)
    private shippingsRepository: Repository<Shipping>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  // Tạo tracking number tự động
  private generateTrackingNumber(carrier?: string): string {
    const prefix = carrier ? carrier.toUpperCase().substring(0, 3) : 'SHIP';
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: ShippingStatus,
    orderId?: number,
    carrier?: string,
  ) {
    const query = this.shippingsRepository
      .createQueryBuilder('shipping')
      .leftJoinAndSelect('shipping.order', 'order')
      .orderBy('shipping.created_at', 'DESC');

    if (status) {
      query.andWhere('shipping.status = :status', { status });
    }

    if (orderId) {
      query.andWhere('shipping.order_id = :orderId', { orderId });
    }

    if (carrier) {
      query.andWhere('shipping.carrier LIKE :carrier', { carrier: `%${carrier}%` });
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

  async findOne(id: number) {
    const shipping = await this.shippingsRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!shipping) {
      throw new NotFoundException(`Đơn vận chuyển với ID ${id} không tồn tại`);
    }

    return shipping;
  }

  async findByTrackingNumber(trackingNumber: string) {
    const shipping = await this.shippingsRepository.findOne({
      where: { tracking_number: trackingNumber },
      relations: ['order'],
    });

    if (!shipping) {
      throw new NotFoundException(
        `Không tìm thấy đơn vận chuyển với mã vận đơn ${trackingNumber}`,
      );
    }

    return shipping;
  }

  async findByOrderId(orderId: number) {
    return this.shippingsRepository.findOne({
      where: { order_id: orderId },
      relations: ['order'],
    });
  }

  async create(dto: CreateShippingDto) {
    // Kiểm tra order tồn tại
    const order = await this.ordersRepository.findOne({
      where: { id: dto.order_id },
    });

    if (!order) {
      throw new NotFoundException(`Đơn hàng với ID ${dto.order_id} không tồn tại`);
    }

    // Kiểm tra đã có shipping cho order này chưa
    const existingShipping = await this.shippingsRepository.findOne({
      where: { order_id: dto.order_id },
    });

    if (existingShipping) {
      throw new BadRequestException('Đơn hàng này đã có đơn vận chuyển');
    }

    // Tạo tracking number nếu chưa có
    let trackingNumber = dto.tracking_number;
    if (!trackingNumber) {
      trackingNumber = this.generateTrackingNumber(dto.carrier || undefined);
    }

    // Kiểm tra tracking number unique
    const existingTracking = await this.shippingsRepository.findOne({
      where: { tracking_number: trackingNumber },
    });

    if (existingTracking) {
      // Tạo lại nếu trùng
      trackingNumber = this.generateTrackingNumber(dto.carrier || undefined);
    }

    // Tạo shipping
    const shipping = this.shippingsRepository.create({
      order_id: dto.order_id,
      carrier: dto.carrier || null,
      service_type: dto.service_type || null,
      tracking_number: trackingNumber,
      estimated_delivery_date: dto.estimated_delivery_date
        ? new Date(dto.estimated_delivery_date)
        : null,
      status: dto.status || ShippingStatus.PENDING,
      shipping_fee: dto.shipping_fee || Number(order.shipping_fee) || 0,
      insurance_fee: dto.insurance_fee || 0,
      cod_fee: dto.cod_fee || 0,
      notes: dto.notes || null,
      delivery_attempts: 0,
    });

    const saved = await this.shippingsRepository.save(shipping);

    // Cập nhật order với tracking number và carrier
    order.tracking_number = trackingNumber;
    if (dto.carrier) {
      order.shipping_carrier = dto.carrier;
    }
    await this.ordersRepository.save(order);

    return {
      success: true,
      message: 'Tạo đơn vận chuyển thành công',
      data: saved,
    };
  }

  async update(id: number, dto: UpdateShippingDto) {
    const shipping = await this.shippingsRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!shipping) {
      throw new NotFoundException(`Đơn vận chuyển với ID ${id} không tồn tại`);
    }

    // Cập nhật các field
    if (dto.carrier !== undefined) shipping.carrier = dto.carrier;
    if (dto.service_type !== undefined) shipping.service_type = dto.service_type;
    if (dto.tracking_number !== undefined) shipping.tracking_number = dto.tracking_number;
    if (dto.estimated_delivery_date !== undefined) {
      shipping.estimated_delivery_date = dto.estimated_delivery_date
        ? new Date(dto.estimated_delivery_date)
        : null;
    }
    if (dto.shipped_date !== undefined) {
      shipping.shipped_date = dto.shipped_date ? new Date(dto.shipped_date) : null;
    }
    if (dto.delivered_date !== undefined) {
      shipping.delivered_date = dto.delivered_date ? new Date(dto.delivered_date) : null;
    }
    if (dto.status !== undefined) shipping.status = dto.status;
    if (dto.shipping_fee !== undefined) shipping.shipping_fee = dto.shipping_fee;
    if (dto.insurance_fee !== undefined) shipping.insurance_fee = dto.insurance_fee;
    if (dto.cod_fee !== undefined) shipping.cod_fee = dto.cod_fee;
    if (dto.delivery_attempts !== undefined) shipping.delivery_attempts = dto.delivery_attempts;
    if (dto.notes !== undefined) shipping.notes = dto.notes;

    // Tự động cập nhật timestamp khi status thay đổi
    const now = new Date();
    if (dto.status) {
      switch (dto.status) {
        case ShippingStatus.PICKED_UP:
        case ShippingStatus.IN_TRANSIT:
          if (!shipping.shipped_date) {
            shipping.shipped_date = now;
          }
          break;
        case ShippingStatus.DELIVERED:
          shipping.delivered_date = now;
          // Cập nhật order
          if (shipping.order) {
            shipping.order.delivered_at = now;
            await this.ordersRepository.save(shipping.order);
          }
          break;
      }
    }

    const updated = await this.shippingsRepository.save(shipping);

    // Cập nhật order nếu có thay đổi tracking_number hoặc carrier
    if (dto.tracking_number && shipping.order) {
      shipping.order.tracking_number = dto.tracking_number;
      await this.ordersRepository.save(shipping.order);
    }
    if (dto.carrier !== undefined && dto.carrier !== null && shipping.order) {
      shipping.order.shipping_carrier = dto.carrier;
      await this.ordersRepository.save(shipping.order);
    }

    return {
      success: true,
      message: 'Cập nhật đơn vận chuyển thành công',
      data: updated,
    };
  }

  async updateStatus(
    id: number,
    status: ShippingStatus,
    location?: string,
    description?: string,
  ) {
    const shipping = await this.shippingsRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!shipping) {
      throw new NotFoundException(`Đơn vận chuyển với ID ${id} không tồn tại`);
    }

    const oldStatus = shipping.status;
    shipping.status = status;

    // Tự động cập nhật timestamp
    const now = new Date();
    switch (status) {
      case ShippingStatus.PICKED_UP:
      case ShippingStatus.IN_TRANSIT:
        if (!shipping.shipped_date) {
          shipping.shipped_date = now;
        }
        break;
      case ShippingStatus.DELIVERED:
        shipping.delivered_date = now;
        if (shipping.order) {
          shipping.order.delivered_at = now;
          await this.ordersRepository.save(shipping.order);
        }
        break;
      case ShippingStatus.FAILED_DELIVERY:
        shipping.delivery_attempts = (shipping.delivery_attempts || 0) + 1;
        break;
    }

    if (description) {
      shipping.notes = shipping.notes
        ? `${shipping.notes}\n${description}`
        : description;
    }

    const updated = await this.shippingsRepository.save(shipping);

    return {
      success: true,
      message: `Trạng thái đã thay đổi từ ${oldStatus} sang ${status}`,
      data: updated,
    };
  }

  async remove(id: number) {
    const shipping = await this.shippingsRepository.findOne({ where: { id } });

    if (!shipping) {
      throw new NotFoundException(`Đơn vận chuyển với ID ${id} không tồn tại`);
    }

    await this.shippingsRepository.remove(shipping);

    return {
      success: true,
      message: 'Xóa đơn vận chuyển thành công',
    };
  }
}

