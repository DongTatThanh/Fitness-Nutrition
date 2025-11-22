import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminAuthGuard extends AuthGuard('admin-jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

