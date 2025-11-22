import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminManagementService } from './super-admin-management.service';
import { SuperAdminGuard } from './super-admin.guard';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule], // Import AdminModule để sử dụng AdminService
  controllers: [SuperAdminController],
  providers: [SuperAdminManagementService, SuperAdminGuard],
  exports: [SuperAdminGuard, SuperAdminManagementService],
})
export class SuperAdminModule {}

