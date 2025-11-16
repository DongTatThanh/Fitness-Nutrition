import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Add custom logic if needed
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // If no user or error, allow request to proceed but req.user will be undefined
    // This allows optional authentication
    if (err || !user) {
      return null;
    }
    return user;
  }
}
