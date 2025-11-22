import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './admin.entity';
import { AdminRole } from './admin-role.entity';
import { AdminActivityLog } from './admin-activity-log.entity';
import { AdminService } from './admin.service';
import { AdminAuthService } from './admin-auth.service';
import { AdminActivityLogService } from './admin-activity-log.service';
import { AdminRoleService } from './admin-role.service';
import { AdminController } from './admin.controller';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { AdminAuthGuard } from './admin-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, AdminRole, AdminActivityLog]),
    PassportModule,
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'change_this_secret',
      signOptions: { expiresIn: '24h' }, // Admin token có thể có thời gian dài hơn
    }),
  ],
  providers: [AdminService, AdminAuthService, AdminActivityLogService, AdminRoleService, AdminJwtStrategy, AdminAuthGuard],
  controllers: [AdminController],
  exports: [AdminService, AdminAuthGuard, AdminAuthService, AdminActivityLogService, AdminRoleService],
})
export class AdminModule {}

