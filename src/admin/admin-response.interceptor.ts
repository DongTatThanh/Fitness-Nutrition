import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interceptor để chuẩn hóa response Admin
 * Đảm bảo response có cả `id` và `admin_id` để frontend có thể sử dụng
 */
@Injectable()
export class AdminResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // Nếu là array
        if (Array.isArray(data)) {
          return data.map(item => this.transformAdmin(item));
        }
        // Nếu là object
        if (data && typeof data === 'object') {
          return this.transformAdmin(data);
        }
        return data;
      })
    );
  }

  private transformAdmin(admin: any): any {
    if (!admin || typeof admin !== 'object') {
      return admin;
    }

    // Tạo object mới để không mutate original
    const transformed = { ...admin };

    // Đảm bảo có cả `id` và `admin_id`
    if (transformed.admin_id !== undefined && transformed.id === undefined) {
      transformed.id = transformed.admin_id;
    }
    if (transformed.id !== undefined && transformed.admin_id === undefined) {
      transformed.admin_id = transformed.id;
    }

    // Xử lý nested objects (nếu có)
    if (transformed.data && Array.isArray(transformed.data)) {
      transformed.data = transformed.data.map((item: any) => this.transformAdmin(item));
    }

    return transformed;
  }
}

