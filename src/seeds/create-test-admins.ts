import 'reflect-metadata';
import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Admin } from '../admin/admin.entity';

async function createTestAdmins() {
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
    const password = 'Admin123!';
    const passwordHash = await bcrypt.hash(password, 10);

    // Danh sách admin cần tạo
    const testAdmins = [
      {
        email: 'admin1@example.com',
        full_name: 'Nguyễn Văn Admin',
        phone: '0123456789',
        role: 'admin',
        is_active: 1,
      },
      {
        email: 'manager1@example.com',
        full_name: 'Trần Thị Manager',
        phone: '0987654321',
        role: 'manager',
        is_active: 1,
      },
      {
        email: 'admin2@example.com',
        full_name: 'Lê Văn Test',
        phone: '0111222333',
        role: 'admin',
        is_active: 0, // Bị vô hiệu hóa
      },
    ];

    for (const adminData of testAdmins) {
      // Kiểm tra email đã tồn tại chưa
      const existing = await adminRepository.findOne({
        where: { email: adminData.email },
      });

      if (existing) {
        existing.password_hash = passwordHash;
        existing.full_name = adminData.full_name;
        existing.phone = adminData.phone;
        existing.role = adminData.role;
        existing.is_active = adminData.is_active;
        await adminRepository.save(existing);
      } else {
        const admin = adminRepository.create({
          email: adminData.email,
          password_hash: passwordHash,
          full_name: adminData.full_name,
          phone: adminData.phone,
          role: adminData.role,
          is_active: adminData.is_active,
        });
        await adminRepository.save(admin);
      }
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

createTestAdmins();

