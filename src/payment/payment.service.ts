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
      
    // Tạo thông tin thanh toán theo orderId
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
            expireAt: new Date(Date.now() + 15 * 60 * 1000), // hạn 15 phút
        };
    }

    // Tạo thông tin thanh toán theo orderNumber
    async createPaymentInfoByNumber(orderNumber: string, userId: number) {
        const order = await this.orderService.getOrderByNumber(orderNumber, userId);

        if (!order) {
            throw new NotFoundException(`Đơn hàng với số ${orderNumber} không tồn tại.`);
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
            expireAt: new Date(Date.now() + 15 * 60 * 1000), // hạn 15 phút
        };
    }

    // Tạo QR code 
    generateQRCode(amount: number, content: string): string {
   
        const bankBin = this.getBankBin(this.bankCode);
        const accountNo = this.accountNumber;
        const accountName = this.accountName;
        const amountValue = Math.round(amount);
        const addInfo = encodeURIComponent(content);
        
        
        return `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.jpg?amount=${amountValue}&addInfo=${addInfo}&accountName=${encodeURIComponent(accountName)}`;
    }

    // Lấy BIN code của ngân hàng (dùng cho VietQR)
    getBankBin(bankCode: string): string {
        const bankBins = {
            'TPBANK': '970423',   // TPBank
            'VCB': '970436',      // Vietcombank
            'TCB': '970407',      // Techcombank
            'MB': '970422',       // MB Bank
            'ACB': '970416',      // ACB
            'VPB': '970432',      // VPBank
            'BIDV': '970418',     // BIDV
            'VTB': '970415',      // Vietinbank
            'AGR': '970405',      // Agribank
            'SCB': '970429',      // SCB
            'MSB': '970426',      // MSB
            'SACOMBANK': '970403', // Sacombank
        };
        return bankBins[bankCode] || bankCode;
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
            //  gửi yêu cầu API lấy danh sách giao dịch gần đây    sepay 
            const apiEndpoint = `${this.apiUrl}/transactions/list/${this.accountNumber}`;
            
            const response = await firstValueFrom(
                this.httpService.get(apiEndpoint, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',  // dữ liệu gửi lên 
                    },
                    params: {
                        limit: 50,
                    }
                })
            );

            const transactions = response.data.transactions || [];

            const transaction = transactions.find((tx: any) =>
                tx.transaction_content?.toUpperCase().includes(orderNumber.toUpperCase())
            );

            if (transaction && parseFloat(transaction.amount_in) >= order.total_amount) {
                await this.orderService.updatePaymentStatus(order.id, PaymentStatus.PAID);
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
            throw new HttpException(
                error.response?.data?.messages?.error || error.message || 'Lỗi khi kiểm tra trạng thái thanh toán', 
                error.response?.status || error.status || HttpStatus.INTERNAL_SERVER_ERROR
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
                const {
                    gateway,
                    transactionDate,
                    accountNumber,
                    subAccount,
                    transferType,
                    transferAmount,
                    accumulated,
                    code,
                    content,
                    referenceCode,
                    description
                } = webhookData;

                if (!content || !transferAmount || transferType !== 'in') {
                    return { 
                        success: false, 
                        message: 'lỗi dữ liệu webhook không hợp lệ' 
                    };
                }

                const orderNumber = this.extractOrderNumber(content); // tách nội dung chuyển khoản
                
                if (!orderNumber) {
                    return { 
                        success: false, 
                        message: 'Không tìm thấy mã đơn hàng trong nội dung chuyển khoản' 
                    };
                }

                const order = await this.orderService.findByOrderNumber(orderNumber);

                if (!order) {
                    return { 
                        success: false, 
                        message: `Không tìm thấy đơn hàng ${orderNumber}` 
                    };
                }
            
                const transferAmountNum = parseFloat(transferAmount);
                const orderAmountNum = parseFloat(order.total_amount.toString());
                
                if (transferAmountNum >= orderAmountNum && 
                    order.payment_status === PaymentStatus.PENDING) {

                    await this.orderService.updatePaymentStatus(order.id, PaymentStatus.PAID);

                    const transactionData = {
                        id: code || referenceCode,
                        gateway,
                        transaction_date: transactionDate,
                        account_number: accountNumber,
                        sub_account: subAccount,
                        amount_in: transferAmount,
                        amount_out: 0,
                        accumulated,
                        code,
                        transaction_content: content,
                        reference_number: referenceCode,
                        description,
                    };

                    await this.createPaymentRecord(order.id, transactionData);

                    return {
                        success: true,
                        message: `Đã xác nhận thanh toán cho đơn hàng ${orderNumber}`,
                        orderId: order.id,
                    };
                }

                if (order.payment_status !== PaymentStatus.PENDING) {
                    return { 
                        success: false, 
                        message: 'Đơn hàng đã được xử lý trước đó' 
                    };
                }

                if (transferAmountNum < orderAmountNum) {
                    return { 
                        success: false, 
                        message: `Số tiền không khớp. Cần: ${order.total_amount}, Nhận: ${transferAmount}` 
                    };
                }

                return { 
                    success: false, 
                    message: 'Không thể xử lý thanh toán' 
                };

            } catch (error) {
                return { 
                    success: false, 
                    message: 'Lỗi xử lý webhook: ' + error.message 
                };
            }
        }

    // Trích xuất order number từ nội dung chuyển khoản
    private extractOrderNumber(content: string): string | null {
        const match = content.match(/FN\d+/i);
        return match ? match[0].toUpperCase() : null;
    }

    // Lấy danh sách transactions gần đây từ SePay (để test)
    async getRecentTransactions() {
        try {
            const apiEndpoint = `${this.apiUrl}/transactions/list/${this.accountNumber}`;
            
            const response = await firstValueFrom(
                this.httpService.get(apiEndpoint, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    params: {
                        limit: 20,
                    }
                })
            );

            return {
                success: true,
                count: response.data.transactions?.length || 0,
                transactions: response.data.transactions || [],
            };
        } catch (error) {
            throw new HttpException(
                'Lỗi khi lấy danh sách giao dịch', 
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Manual confirm payment (chỉ dùng testing - khi không thể test với transaction thật)
    async manualConfirmPayment(orderNumber: string, transactionId: string, userId: number) {
        try {
            const order = await this.orderService.getOrderByNumber(orderNumber, userId);
            
            if (!order) {
                throw new NotFoundException('Không tìm thấy đơn hàng');
            }

            if (order.payment_status === PaymentStatus.PAID) {
                return {
                    success: false,
                    message: 'Đơn hàng đã được thanh toán trước đó',
                    order,
                };
            }

            const fakeTransactionData = {
                id: transactionId || `MANUAL_${Date.now()}`,
                amount_in: order.total_amount.toString(),
                transaction_content: `Manual confirmation for ${orderNumber}`,
                transaction_date: new Date().toISOString(),
            };

            await this.orderService.updatePaymentStatus(order.id, PaymentStatus.PAID);
            await this.createPaymentRecord(order.id, fakeTransactionData);

            return {
                success: true,
                message: 'Đã xác nhận thanh toán thủ công (TEST MODE)',
                order: await this.orderService.getOrderById(order.id, userId),
            };
        } catch (error) {
            throw new HttpException(
                error.message || 'Lỗi khi xác nhận thanh toán thủ công',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}