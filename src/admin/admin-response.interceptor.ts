import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class AdminResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // Nếu data đã có format success, giữ nguyên
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        
        // Nếu không, wrap vào format chuẩn
        return {
          success: true,
          data: data,
        };
      }),
    );
  }
}


