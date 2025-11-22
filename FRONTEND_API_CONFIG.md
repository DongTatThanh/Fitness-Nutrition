# Hướng dẫn cấu hình Frontend để gọi API Backend

## Vấn đề

Frontend đang gọi `/api/super-admin/auth/login` nhưng route này không tồn tại vì đây là backend NestJS, không phải Next.js API route.

## Giải pháp

### Cách 1: Gọi trực tiếp đến Backend (Khuyến nghị)

Cấu hình API base URL trong frontend:

```typescript
// config/api.ts hoặc utils/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3201';

export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  // ... rest of your code
};
```

**Thêm vào `.env.local` (frontend):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3201
```

### Cách 2: Tạo Next.js API Route Proxy

Nếu bạn muốn giữ `/api/` prefix, tạo Next.js API route:

**File: `app/api/super-admin/[...path]/route.ts` (App Router)**

```typescript
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3201';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  path: string[],
  method: string
) {
  const pathStr = path.join('/');
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  const fullPath = `/super-admin/${pathStr}${searchParams ? `?${searchParams}` : ''}`;
  
  const token = request.headers.get('authorization');
  
  try {
    const response = await fetch(`${BACKEND_URL}${fullPath}`, {
      method,
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
      body: method !== 'GET' && method !== 'DELETE' 
        ? JSON.stringify(await request.json().catch(() => ({})))
        : undefined,
    });
    
    const data = await response.json().catch(() => ({ message: 'No content' }));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to proxy request' },
      { status: 500 }
    );
  }
}
```

**Hoặc cho Pages Router: `pages/api/super-admin/[...path].ts`**

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3201';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { path } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : path || '';
  const fullPath = `/super-admin/${pathStr}`;
  
  const token = req.headers.authorization;
  
  try {
    const response = await fetch(`${BACKEND_URL}${fullPath}`, {
      method: req.method,
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'DELETE' 
        ? JSON.stringify(req.body)
        : undefined,
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to proxy request' });
  }
}
```

## Backend Endpoints

Sau khi cấu hình, các endpoints sẽ là:

### Super Admin Auth:
- `POST /super-admin/auth/login` - Đăng nhập
- `GET /super-admin/auth/me` - Lấy thông tin
- `GET /super-admin/auth/profile` - Lấy profile
- `POST /super-admin/auth/logout` - Đăng xuất

### Super Admin Management:
- `POST /super-admin/create-admin` - Tạo admin
- `GET /super-admin/list` - Danh sách admin
- `GET /super-admin/:id` - Chi tiết admin
- `PATCH /super-admin/:id/role` - Đổi role
- `PATCH /super-admin/:id/status` - Bật/tắt admin
- `PUT /super-admin/:id` - Cập nhật admin
- `PATCH /super-admin/:id/password` - Đổi mật khẩu
- `DELETE /super-admin/:id` - Xóa admin

### Activity Logs:
- `GET /super-admin/activity-logs` - Danh sách logs
- `GET /super-admin/activity-logs/:id` - Chi tiết log

## Thông tin đăng nhập Super Admin

Sau khi chạy SQL script `database/create-admin-tables.sql`:

- **Email:** `superadmin@example.com`
- **Password:** `SuperAdmin123!`

