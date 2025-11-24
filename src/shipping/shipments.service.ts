import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment, ShipmentStatus } from './shipment.entity';
import { ShipmentTracking } from './shipment-tracking.entity';
import { Order } from '../orders/order.entity';
import { ShippingCarrier } from './shipping-carrier.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentsRepository: Repository<Shipment>,
    @InjectRepository(ShipmentTracking)
    private trackingRepository: Repository<ShipmentTracking>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(ShippingCarrier)
    private carriersRepository: Repository<ShippingCarrier>,
  ) {}

  // Tạo tracking number tự động
  private generateTrackingNumber(carrierCode: string): string {
    const prefix = carrierCode.toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: ShipmentStatus,
    carrierId?: number,
    orderId?: number,
  ) {
    const query = this.shipmentsRepository
      .createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.order', 'order')
      .leftJoinAndSelect('shipment.carrier', 'carrier')
      .orderBy('shipment.created_at', 'DESC');

    if (status) {
      query.andWhere('shipment.status = :status', { status });
    }

    if (carrierId) {
      query.andWhere('shipment.carrier_id = :carrierId', { carrierId });
    }

    if (orderId) {
      query.andWhere('shipment.order_id = :orderId', { orderId });
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
    const shipment = await this.shipmentsRepository.findOne({
      where: { id },
      relations: ['order', 'carrier', 'tracking_history'],
    });

    if (!shipment) {
      throw new NotFoundException(`Đơn vận chuyển với ID ${id} không tồn tại`);
    }

    return shipment;
  }

  async findByTrackingNumber(trackingNumber: string) {
    const shipment = await this.shipmentsRepository.findOne({
      where: { tracking_number: trackingNumber },
      relations: ['order', 'carrier', 'tracking_history'],
    });

    if (!shipment) {
      throw new NotFoundException(
        `Không tìm thấy đơn vận chuyển với mã vận đơn ${trackingNumber}`,
      );
    }

    return shipment;
  }

  // Tạo đơn vận chuyển từ order
  async create(dto: CreateShipmentDto, createdBy?: number) {
    // Kiểm tra order tồn tại
    const order = await this.ordersRepository.findOne({
      where: { id: dto.order_id },
    });

    if (!order) {
      throw new NotFoundException(`Đơn hàng với ID ${dto.order_id} không tồn tại`);
    }

    // Kiểm tra đã có shipment cho order này chưa
    const existingShipment = await this.shipmentsRepository.findOne({
      where: { order_id: dto.order_id },
    });

    if (existingShipment) {
      throw new BadRequestException('Đơn hàng này đã có đơn vận chuyển');
    }

    // Kiểm tra carrier
    const carrier = await this.carriersRepository.findOne({
      where: { id: dto.carrier_id },
    });

    if (!carrier) {
      throw new NotFoundException(
        `Đơn vị vận chuyển với ID ${dto.carrier_id} không tồn tại`,
      );
    }

    // Tạo tracking number nếu chưa có
    let trackingNumber = dto.tracking_number;
    if (!trackingNumber) {
      trackingNumber = this.generateTrackingNumber(carrier.code);
    }

    // Kiểm tra tracking number unique
    const existingTracking = await this.shipmentsRepository.findOne({
      where: { tracking_number: trackingNumber },
    });

    if (existingTracking) {
      // Tạo lại nếu trùng
      trackingNumber = this.generateTrackingNumber(carrier.code);
    }

    // Tạo shipment
    const shipment = this.shipmentsRepository.create({
      order_id: dto.order_id,
      carrier_id: dto.carrier_id,
      tracking_number: trackingNumber,
      status: ShipmentStatus.PENDING,
      shipping_fee: Number(order.shipping_fee) || 0,
      weight: dto.weight || null,
      dimensions: dto.dimensions || null,
      delivery_address: order.shipping_address,
      delivery_city: order.shipping_city,
      delivery_district: order.shipping_district,
      delivery_ward: order.shipping_ward,
      delivery_postal_code: order.shipping_postal_code,
      recipient_name: order.customer_name,
      recipient_phone: order.customer_phone,
      notes: dto.notes || null,
      created_by: createdBy || null,
    });

    const saved = await this.shipmentsRepository.save(shipment);

    // Tạo tracking history đầu tiên
    await this.addTrackingHistory(saved.id, {
      status: ShipmentStatus.PENDING,
      description: 'Đơn vận chuyển đã được tạo',
    });

    // Cập nhật order với tracking number và carrier
    order.tracking_number = trackingNumber;
    order.shipping_carrier = carrier.name;
    await this.ordersRepository.save(order);

    return {
      success: true,
      message: 'Tạo đơn vận chuyển thành công',
      data: saved,
    };
  }

  // Cập nhật trạng thái shipment
  async updateStatus(
    id: number,
    dto: UpdateShipmentStatusDto,
    updatedBy?: number,
  ) {
    const shipment = await this.shipmentsRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!shipment) {
      throw new NotFoundException(`Đơn vận chuyển với ID ${id} không tồn tại`);
    }

    const oldStatus = shipment.status;
    shipment.status = dto.status;

    // Cập nhật timestamp tương ứng
    const now = new Date();
    switch (dto.status) {
      case ShipmentStatus.PICKED_UP:
        shipment.picked_up_at = now;
        break;
      case ShipmentStatus.IN_TRANSIT:
        shipment.in_transit_at = now;
        break;
      case ShipmentStatus.OUT_FOR_DELIVERY:
        shipment.out_for_delivery_at = now;
        break;
      case ShipmentStatus.DELIVERED:
        shipment.delivered_at = now;
        // Cập nhật order
        if (shipment.order) {
          shipment.order.delivered_at = now;
          await this.ordersRepository.save(shipment.order);
        }
        break;
      case ShipmentStatus.FAILED:
        shipment.failed_at = now;
        break;
      case ShipmentStatus.RETURNED:
        shipment.returned_at = now;
        break;
    }

    const updated = await this.shipmentsRepository.save(shipment);

    // Thêm tracking history
    await this.addTrackingHistory(id, {
      status: dto.status,
      location: dto.location || null,
      description:
        dto.description ||
        `Trạng thái thay đổi từ ${oldStatus} sang ${dto.status}`,
    });

    return {
      success: true,
      message: 'Cập nhật trạng thái đơn vận chuyển thành công',
      data: updated,
    };
  }

  // Thêm tracking history
  async addTrackingHistory(
    shipmentId: number,
    data: {
      status: string;
      location?: string | null;
      description?: string | null;
    },
  ) {
    const tracking = this.trackingRepository.create({
      shipment_id: shipmentId,
      status: data.status,
      location: data.location || null,
      description: data.description || null,
      timestamp: new Date(),
    });

    return this.trackingRepository.save(tracking);
  }

  // Lấy lịch sử tracking
  async getTrackingHistory(shipmentId: number) {
    return this.trackingRepository.find({
      where: { shipment_id: shipmentId },
      order: { timestamp: 'ASC' },
    });
  }

  // Lấy shipment theo order_id
  async findByOrderId(orderId: number) {
    return this.shipmentsRepository.findOne({
      where: { order_id: orderId },
      relations: ['carrier', 'tracking_history'],
    });
  }
}

