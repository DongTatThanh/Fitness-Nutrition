import { Injectable, HttpException, HttpStatus, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Payment, PaymentStatus as PaymentStatusEnum } from "./payment.entity";
import { OrderService } from "../orders/order.service";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { PaymentStatus } from "../orders/enum/payment-status.enum";

@Injectable()
export class PaymentService {
    private readonly apiKey: string;
    private readonly accountNumber: string;
    private readonly accountName: string;
    private readonly bankCode: string;
    private readonly apiUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly orderService: OrderService,
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
    ) {
        this.apiKey = this.configService.get<string>('SEPAY_API_KEY') || '';
        this.accountNumber = this.configService.get<string>('SEPAY_ACCOUNT_NUMBER') || '';
        this.accountName = this.configService.get<string>('SEPAY_ACCOUNT_NAME') || '';
        this.bankCode = this.configService.get<string>('SEPAY_BANK_CODE') || '';
        this.apiUrl = this.configService.get<string>('SEPAY_API_URL') || '';
    }
      
    // Tạo thông tin thanh toán 
    async createPaymentInfo(orderId: number, userId: number) {
        const order = await this.orderService.getOrderById(orderId, userId);

        if (!order) {
            throw new NotFoundException(`Đơn hàng với ID ${orderId} không tồn tại.`);
        }

        // Kiểm tra đã thanh toán chưa
        if (order.payment_status === PaymentStatus.PAID) {
            throw new HttpException('Đơn hàng đã được thanh toán.', HttpStatus.BAD_REQUEST);
        }

        const qrcode = this.generateQRCode(order.total_amount, order.order_number);

        return {
            orderId: order.id,
            orderNumber: order.order_number,
            bankInfo: {
                accountNumber: this.accountNumber,
                accountName: this.accountName,
                bankCode: this.bankCode,
                bankName: this.getBankName(this.bankCode),
            },
            amount: order.total_amount,
            content: order.order_number,
            qrCode: qrcode, 
            message: `Chuyển khoản ${order.total_amount.toLocaleString('vi-VN')}đ với nội dung: ${order.order_number}`,
            expireAt: new Date(Date.now() + 15 * 60 * 1000), // hết hạn sau 15 phút
        };
    }

    // Tạo QR code 
    generateQRCode(amount: number, content: string): string {
        return `https://img.vietqr.io/image/${this.bankCode}-${this.accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(this.accountName)}`;
    }

    // Lấy tên ngân hàng
    getBankName(bankCode: string): string {
        const banks = {
            'TPBANK': 'Ngân hàng Tiên Phong',
            'VCB': 'Vietcombank',
            'TCB': 'Techcombank',
            'MB': 'MB Bank',
            'ACB': 'ACB',
            'VPB': 'VPBank',
        };
        return banks[bankCode] || bankCode;
    }

    // Kiểm tra trạng thái giao dịch 
    async checkTransaction(orderNumber: string, userId: number) {
        try {
            const order = await this.orderService.getOrderByNumber(orderNumber, userId);
      
            if (!order) {
                throw new NotFoundException('Không tìm thấy đơn hàng');
            }
            
            // Gọi SePay API để kiểm tra trạng thái thanh toán
            const response = await firstValueFrom(
                this.httpService.get(`${this.apiUrl}/transactions`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    params: {
                        limit: 100,
                    }
                })
            );

            const transactions = response.data.transactions || [];
            const transaction = transactions.find((tx: any) =>
                tx.transaction_content?.toUpperCase().includes(orderNumber.toUpperCase())
            );

            if (transaction && parseFloat(transaction.amount_in) >= order.total_amount) {
                // Cập nhật trạng thái thanh toán trong đơn hàng
                await this.orderService.updatePaymentStatus(order.id, PaymentStatus.PAID);

                // Lưu payment record
                await this.createPaymentRecord(order.id, transaction);

                return {
                    success: true,
                    message: 'Thanh toán thành công',
                    order: await this.orderService.getOrderById(order.id, userId),
                };
            }

            return {
                success: false,
                message: 'Chưa nhận được thanh toán',
            };
        } catch (error) {
            console.error('Error checking transaction:', error);
            throw new HttpException(
                'Lỗi khi kiểm tra trạng thái thanh toán', 
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Tạo payment record
    async createPaymentRecord(orderId: number, transactionData: any) {
        const payment = this.paymentRepository.create({
            order_id: orderId,
            payment_method: 'bank_transfer' as any,
            amount: parseFloat(transactionData.amount_in),
            currency: 'VND',
            transaction_id: transactionData.id,
            gateway_response: transactionData,
            status: PaymentStatusEnum.COMPLETED,
            completed_at: new Date(),
        });

        return await this.paymentRepository.save(payment);
    }

    // Webhook xử lý cập nhật trạng thái thanh toán tự động từ SePay
    async handleWebhook(webhookData: any) {
        try {
            const { content, amount_in, id } = webhookData;

            console.log('Webhook received:', webhookData);

            const orderNumber = this.extractOrderNumber(content);
            
            if (!orderNumber) {
                return { success: false, message: 'Không tìm thấy mã đơn hàng' };
            }

            const order = await this.orderService.findByOrderNumber(orderNumber);

            if (!order) {
                return { success: false, message: 'Không tìm thấy đơn hàng' };
            }

            if (parseFloat(amount_in) >= order.total_amount && order.payment_status === PaymentStatus.PENDING) {
                // Cập nhật trạng thái đơn hàng
                await this.orderService.updatePaymentStatus(order.id, PaymentStatus.PAID);

                // Lưu payment record
                await this.createPaymentRecord(order.id, webhookData);

                return {
                    success: true,
                    message: 'Đơn hàng đã thanh toán',
                    orderId: order.id,
                };
            }

            return { success: false, message: 'Số tiền không khớp hoặc đơn đã xử lý' };
        } catch (error) {
            console.error('Webhook error:', error);
            return { success: false, message: 'Lỗi xử lý webhook' };
        }
    }

    // Trích xuất order number từ nội dung chuyển khoản
    private extractOrderNumber(content: string): string | null {
        const match = content.match(/FN\d+/i);
        return match ? match[0].toUpperCase() : null;
    }
}