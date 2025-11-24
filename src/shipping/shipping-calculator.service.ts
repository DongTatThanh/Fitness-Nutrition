import { Injectable, BadRequestException } from '@nestjs/common';
import { ShippingZonesService } from './shipping-zones.service';
import { ShippingRatesService } from './shipping-rates.service';
import { ShippingCarriersService } from './shipping-carriers.service';
import { CalculateShippingFeeDto } from './dto/calculate-shipping-fee.dto';

@Injectable()
export class ShippingCalculatorService {
  constructor(
    private zonesService: ShippingZonesService,
    private ratesService: ShippingRatesService,
    private carriersService: ShippingCarriersService,
  ) {}

  // Tính phí vận chuyển
  async calculateShippingFee(dto: CalculateShippingFeeDto) {
    try {
      const { address, city, district, weight, carrier_id } = dto;

      // Tìm zone dựa trên địa chỉ
      const zone = await this.zonesService.findZoneByAddress(city, district);

      if (!zone) {
        throw new BadRequestException(
          'Không tìm thấy khu vực vận chuyển cho địa chỉ này. Vui lòng chạy SQL script để tạo bảng: database/RUN_THIS_FIRST_SHIPPING.sql',
        );
      }

    // Nếu có carrier_id cụ thể, chỉ tính cho carrier đó
    if (carrier_id) {
      const carrier = await this.carriersService.findOne(carrier_id);
      const rate = await this.ratesService.findRate(carrier_id, zone.id, weight);

      if (!rate) {
        throw new BadRequestException(
          `Không tìm thấy bảng giá phù hợp cho ${carrier.name} tại khu vực ${zone.name}`,
        );
      }

      const fee = this.calculateFee(rate, weight);

      return {
        carrier: {
          id: carrier.id,
          name: carrier.name,
          code: carrier.code,
        },
        zone: {
          id: zone.id,
          name: zone.name,
          code: zone.code,
        },
        weight,
        rate: {
          id: rate.id,
          name: rate.name,
          base_fee: Number(rate.base_fee),
          fee_per_kg: Number(rate.fee_per_kg),
        },
        shipping_fee: fee,
        estimated_days: rate.estimated_days,
      };
    }

    // Nếu không có carrier_id, tính cho tất cả carriers đang hoạt động
    const carriers = await this.carriersService.findActive();
    const results: Array<{
      carrier: { id: number; name: string; code: string };
      zone: { id: number; name: string; code: string };
      weight: number;
      rate: { id: number; name: string; base_fee: number; fee_per_kg: number };
      shipping_fee: number;
      estimated_days: number | null;
    }> = [];

    for (const carrier of carriers) {
      const rate = await this.ratesService.findRate(carrier.id, zone.id, weight);

      if (rate) {
        const fee = this.calculateFee(rate, weight);

        results.push({
          carrier: {
            id: carrier.id,
            name: carrier.name,
            code: carrier.code,
          },
          zone: {
            id: zone.id,
            name: zone.name,
            code: zone.code,
          },
          weight,
          rate: {
            id: rate.id,
            name: rate.name,
            base_fee: Number(rate.base_fee),
            fee_per_kg: Number(rate.fee_per_kg),
          },
          shipping_fee: fee,
          estimated_days: rate.estimated_days,
        });
      }
    }

    if (results.length === 0) {
      throw new BadRequestException(
        'Không tìm thấy bảng giá vận chuyển phù hợp cho địa chỉ này',
      );
    }

    // Sắp xếp theo phí tăng dần
    results.sort((a, b) => a.shipping_fee - b.shipping_fee);

    return {
      zone: {
        id: zone.id,
        name: zone.name,
        code: zone.code,
      },
      weight,
      options: results,
    };
    } catch (error) {
      // Nếu bảng chưa tồn tại, throw error với message rõ ràng
      if (error.message && error.message.includes("doesn't exist")) {
        throw new BadRequestException(
          'Hệ thống vận chuyển chưa được setup. Vui lòng chạy SQL script: database/RUN_THIS_FIRST_SHIPPING.sql',
        );
      }
      throw error;
    }
  }

  // Tính phí dựa trên rate và weight
  private calculateFee(rate: any, weight: number): number {
    const baseFee = Number(rate.base_fee) || 0;
    const feePerKg = Number(rate.fee_per_kg) || 0;
    const minWeight = Number(rate.min_weight) || 0;

    // Tính phí: base_fee + (weight - min_weight) * fee_per_kg
    // Nếu weight < min_weight, chỉ tính base_fee
    if (weight <= minWeight) {
      return baseFee;
    }

    const additionalWeight = weight - minWeight;
    return baseFee + additionalWeight * feePerKg;
  }
}

