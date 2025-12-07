    import { Body, Controller, Get, Post, Param, Req, UseGuards } from "@nestjs/common";
    import { PaymentService } from "./payment.service";
    import type { Request } from "express";
    import { JwtAuthGuard } from "../auth/jwt-auth.guard";

    @Controller('payment')
    @UseGuards(JwtAuthGuard)
    export class PaymentController {
        constructor(private readonly paymentService: PaymentService) {}

        // Tạo thông tin thanh toán (QR code) - nhận orderId hoặc orderNumber
            @Post('info')
            async createPaymentInfo(
                @Req() req: Request,
                @Body('orderId') orderId?: number,
                @Body('orderNumber') orderNumber?: string,
            ) { 
                if (!req['user']?.id) {
                    return {
                        success: false,
                        message: 'Vui lòng đăng nhập để tạo thông tin thanh toán',
                        data: null
                    };
                }
                
                // Nếu có orderNumber thì dùng orderNumber, không thì dùng orderId
                if (orderNumber) {
                    return this.paymentService.createPaymentInfoByNumber(orderNumber, req['user'].id);
                } else if (orderId) {
                    return this.paymentService.createPaymentInfo(orderId, req['user'].id);
                } else {
                    return {
                        success: false,
                        message: 'Vui lòng cung cấp orderId hoặc orderNumber',
                        data: null
                    };
                }
            }

        // Kiểm tra trạng thái thanh toán
        @Get('check/:orderNumber')
        async checkTransaction(
            @Param('orderNumber') orderNumber: string,
            @Req() req: Request,
        ) {
            if (!req['user']?.id) {
                return {
                    success: false,
                    message: 'Vui lòng đăng nhập để kiểm tra thanh toán',
                    data: null
                };
            }
            return this.paymentService.checkTransaction(orderNumber, req['user'].id);
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

       
        @Post('manual-confirm')
        async manualConfirm(
            @Body('orderNumber') orderNumber: string,
            @Body('transactionId') transactionId: string,
            @Req() req: Request,
        ) {
            if (!req['user']?.id) {
                return {
                    success: false,
                    message: 'Vui lòng đăng nhập để xác nhận thanh toán',
                    data: null
                };
            }
            return this.paymentService.manualConfirmPayment(orderNumber, transactionId, req['user'].id);
        }
    }