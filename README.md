# Fitness & Nutrition Management System

## 🎯 Project Overview
Hệ thống quản lý dinh dưỡng và thể hình với đầy đủ tính năng authentication, quản lý sản phẩm và giỏ hàng.

## 🚀 Features
- **Authentication System**: Register, Login, Forgot Password với OTP
- **User Management**: Profile management, Change password
- **Product Management**: Products, Categories, Brands
- **Shopping Cart**: Add, Update, Remove items
- **Email Service**: SMTP integration với HTML templates

## 🛠️ Tech Stack
- **Backend**: NestJS, TypeScript
- **Database**: MySQL với TypeORM
- **Authentication**: JWT, bcryptjs
- **Email**: Nodemailer
- **Validation**: class-validator

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/yourusername/fitness-nutrition.git
cd fitness-nutrition

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database and SMTP settings

# Run database migrations
npm run migration:run

# Start development server
npm run start:dev
```

## 🔧 Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=gymsinhvien

# JWT
JWT_SECRET=your_jwt_secret

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@yourdomain.com

# Server
HOST=0.0.0.0
PORT=3201
FRONTEND_URL=http://localhost:8080
```

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - Đăng ký tài khoản
- `POST /auth/login` - Đăng nhập
- `POST /auth/forgot-password` - Quên mật khẩu
- `POST /auth/verify-otp` - Xác thực OTP
- `POST /auth/reset-password` - Đặt lại mật khẩu
- `PUT /auth/change-password` - Thay đổi mật khẩu
- `GET /auth/profile` - Xem profile
- `PUT /auth/profile` - Cập nhật profile

### Products
- `GET /products` - Danh sách sản phẩm
- `GET /products/:id` - Chi tiết sản phẩm
- `GET /brands` - Danh sách thương hiệu
- `GET /categories` - Danh sách danh mục

### Cart
- `GET /cart` - Xem giỏ hàng
- `POST /cart/items` - Thêm vào giỏ
- `PUT /cart/items/:id` - Cập nhật số lượng
- `DELETE /cart/items/:id` - Xóa khỏi giỏ

## 🏗️ Project Structure

```
src/
├── auth/           # Authentication module
├── users/          # User management
├── products/       # Product management
├── cart/           # Shopping cart
├── brands/         # Brand management
├── categories/     # Category management
└── main.ts         # Application entry point
```

## 🔒 Security Features
- Password hashing với bcryptjs
- JWT token authentication
- Input validation và sanitization
- SQL injection prevention
- CORS configuration
- Rate limiting ready

## 📝 License
MIT License

## 👥 Contributing
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request