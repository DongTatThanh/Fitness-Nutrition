import { Body, Controller, Get, Post, Param, Req } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import type { Request } from "express";

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    // Tạo thông tin thanh toán (QR code)
    @Post('info')
    async createPaymentInfo(
        @Body('orderId') orderId: number,
        @Req() req: Request,
    ) { 
        const userId = req['user']?.id || 1; 
        return this.paymentService.createPaymentInfo(orderId, userId);
    }

    // Kiểm tra trạng thái thanh toán
    @Get('check/:orderNumber')
    async checkTransaction(
        @Param('orderNumber') orderNumber: string,
        @Req() req: Request,
    ) {
        const userId = req['user']?.id || 1; 
        return this.paymentService.checkTransaction(orderNumber, userId);
    }

    // Webhook nhận thông báo từ SePay
    @Post('webhook')
    async handleWebhook(@Body() data: any) {
        // SePay sẽ gửi webhook khi có giao dịch thành công
        console.log('Payment webhook ', data);
        return this.paymentService.handleWebhook(data);
    }
}