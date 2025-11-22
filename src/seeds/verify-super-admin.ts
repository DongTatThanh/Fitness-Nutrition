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
    console.log('✅ Đã kết nối database\n');

    const adminRepository = dataSource.getRepository(Admin);

    // Tìm Super Admin
    const superAdmin = await adminRepository.findOne({
      where: { email: 'superadmin@example.com' },
    });

    if (!superAdmin) {
      console.log('❌ Không tìm thấy Super Admin với email: superadmin@example.com');
      console.log('\nHãy chạy SQL script: database/create-admin-tables.sql');
      await dataSource.destroy();
      return;
    }

    console.log('📋 Thông tin Super Admin:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ID:', superAdmin.admin_id);
    console.log('Email:', superAdmin.email);
    console.log('Full Name:', superAdmin.full_name);
    console.log('Role:', superAdmin.role);
    console.log('Is Active:', superAdmin.is_active);
    console.log('Password Hash:', superAdmin.password_hash?.substring(0, 30) + '...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test password
    const testPassword = 'SuperAdmin123!';
    const isValid = await bcrypt.compare(testPassword, superAdmin.password_hash);
    
    if (isValid) {
      console.log('✅ Password "SuperAdmin123!" KHỚP với hash trong database');
    } else {
      console.log('❌ Password "SuperAdmin123!" KHÔNG khớp với hash trong database');
      console.log('\n🔧 Đang tạo lại password hash...');
      
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('Hash mới:', newHash);
      console.log('\nChạy SQL sau để cập nhật:');
      console.log(`UPDATE admins SET password = '${newHash}' WHERE email = 'superadmin@example.com';`);
    }

    // Kiểm tra role
    if (superAdmin.role !== 'super_admin') {
      console.log(`\n⚠️  Role hiện tại: "${superAdmin.role}" (cần là "super_admin")`);
      console.log('Chạy SQL:');
      console.log(`UPDATE admins SET role = 'super_admin' WHERE email = 'superadmin@example.com';`);
    }

    // Kiểm tra is_active
    if (superAdmin.is_active !== 1) {
      console.log(`\n⚠️  Tài khoản đang bị vô hiệu hóa (is_active = ${superAdmin.is_active})`);
      console.log('Chạy SQL:');
      console.log(`UPDATE admins SET is_active = 1 WHERE email = 'superadmin@example.com';`);
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

verifySuperAdmin();

