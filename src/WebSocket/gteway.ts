import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({ 
  cors: {
    origin: [
      'http://localhost:8081',
     'https://frontend.thgymstore.online',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      /^http:\/\/192\.168\.\d+\.\d+:8081$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:8081$/,
      '*',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class OrdersGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    // WebSocket Gateway initialized
  }

  handleConnection(client: Socket) {
    client.emit('connected', { message: 'Connected to orders gateway' });
  }

  handleDisconnect(client: Socket) {
    // Client disconnected
  }

  /**
   * Gửi thông báo đơn hàng mới đến tất cả client
   * @param orderData - Thông tin đơn hàng mới
   */
  sendNewOrder(orderData: {
    customer_name: string;
    products: Array<{ name: string; quantity: number }>;
    order_date: Date;
    shipping_city?: string;
    shipping_district?: string;
    product_image?: string;
  }) {
    const now = new Date();
    const orderDate = new Date(orderData.order_date);
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMinutes = Math.floor(diffMs / 1000 / 60);
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    // Format thời gian
    let timeAgo: string;
    if (diffMinutes <= 0 && diffSeconds < 10) {
      timeAgo = 'vừa xong';
    } else if (diffMinutes < 1) {
      timeAgo = `${diffSeconds} giây trước`;
    } else if (diffMinutes === 1) {
      timeAgo = '1 phút trước';
    } else {
      timeAgo = `${diffMinutes} phút trước`;
    }

    const primaryProduct = orderData.products[0];
    const productName = primaryProduct
      ? `${primaryProduct.name}${primaryProduct.quantity > 1 ? ` (x${primaryProduct.quantity})` : ''}`
      : 'Sản phẩm';

    const maskedName = this.maskName(orderData.customer_name);
    const location = orderData.shipping_city || orderData.shipping_district || 'Việt Nam';
    const message = `${maskedName} ở ${location} vừa mua ${productName}`;

    // Tạo message hiển thị đơn giản
    const notification = {
      product_name: productName,
      product_image: orderData.product_image,
      message,
      time_ago: timeAgo,
      time_ago_minutes: diffMinutes,
      time_ago_seconds: diffSeconds,
    };

    // Gửi đến tất cả client đang kết nối
    this.server.emit('newOrder', notification);
  }

  private maskName(name: string): string {
    if (!name) {
      return 'Khách hàng ẩn danh';
    }

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return `${parts[0][0]}***`;
    }

    const first = parts[0];
    const last = parts.slice(1).join(' ');
    return `${first[0]}. ${last}`;
  }
}