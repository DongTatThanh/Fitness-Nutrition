import 'reflect-metadata';
import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Admin } from '../admin/admin.entity';

async function verifySuperAdmin() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'gymsinhvien',
    entities: [Admin],
    synchronize: false,
  });

  try {
    await dataSource.initialize();

    const adminRepository = dataSource.getRepository(Admin);

    const superAdmin = await adminRepository.findOne({
      where: { email: 'superadmin@example.com' },
    });

    if (!superAdmin) {
      throw new Error('Super Admin với email superadmin@example.com chưa tồn tại');
    }

    const testPassword = 'SuperAdmin123!';
    const isValid = await bcrypt.compare(testPassword, superAdmin.password_hash);
    
    if (!isValid) {
      throw new Error('Password Super Admin không khớp với giá trị mặc định');
    }

    if (superAdmin.role !== 'super_admin') {
      throw new Error('Super Admin chưa được gán role super_admin');
    }

    if (superAdmin.is_active !== 1) {
      throw new Error('Super Admin đang bị vô hiệu hóa');
    }
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

verifySuperAdmin();

