import 'reflect-metadata';
import { config } from 'dotenv';
config(); // Load .env file FIRST

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Admin } from '../admin/admin.entity';

async function createSuperAdmin() {
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
    console.log('✅ Đã kết nối database');

    const adminRepository = dataSource.getRepository(Admin);

    // Kiểm tra xem đã có Super Admin chưa
    const existingSuperAdmin = await adminRepository.findOne({
      where: { role: 'super_admin' },
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Đã tồn tại Super Admin trong hệ thống');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      await dataSource.destroy();
      return;
    }

    // Thông tin Super Admin mặc định
    const defaultEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
    const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
    const defaultFullName = process.env.SUPER_ADMIN_NAME || 'Super Administrator';

    // Kiểm tra email đã tồn tại chưa
    const existingAdmin = await adminRepository.findOne({
      where: { email: defaultEmail },
    });

    if (existingAdmin) {
      console.log(`⚠️  Email ${defaultEmail} đã tồn tại. Đang cập nhật thành Super Admin...`);
      existingAdmin.role = 'super_admin';
      await adminRepository.save(existingAdmin);
      console.log('✅ Đã cập nhật admin thành Super Admin');
      console.log(`   Email: ${defaultEmail}`);
      console.log(`   Password: ${defaultPassword}`);
      await dataSource.destroy();
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Tạo Super Admin mới
    const superAdmin = adminRepository.create({
      email: defaultEmail,
      password_hash: passwordHash,
      full_name: defaultFullName,
      role: 'super_admin',
      is_active: 1,
    });

    await adminRepository.save(superAdmin);

    console.log('✅ Đã tạo Super Admin thành công!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', defaultEmail);
    console.log('🔑 Password:', defaultPassword);
    console.log('👤 Full Name:', defaultFullName);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  LƯU Ý: Hãy đổi mật khẩu sau khi đăng nhập!');
    console.log('⚠️  LƯU Ý: Xóa hoặc thay đổi biến môi trường sau khi sử dụng!');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Lỗi khi tạo Super Admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();

