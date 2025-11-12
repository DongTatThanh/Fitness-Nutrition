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
            return this.paymentService.handleWebhook(data);
        }

        // API test - lấy tất cả transactions từ SePay
        @Get('transactions')
        async getTransactions() {
            return this.paymentService.getRecentTransactions();
        }

        // API test - manually mark order as paid (chỉ dùng testing)
        @Post('manual-confirm')
        async manualConfirm(
            @Body('orderNumber') orderNumber: string,
            @Body('transactionId') transactionId: string,
            @Req() req: Request,
        ) {
            const userId = req['user']?.id || 1;
            return this.paymentService.manualConfirmPayment(orderNumber, transactionId, userId);
        }
    }