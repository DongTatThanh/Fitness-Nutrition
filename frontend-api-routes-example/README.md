# Next.js API Route Proxy Examples

Copy các file này vào frontend project của bạn.

## App Router

**File:** `app/api/super-admin/[...path]/route.ts`

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

## Pages Router

**File:** `pages/api/super-admin/[...path].ts`

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

## Cấu hình

Thêm vào `.env.local` (frontend):
```env
BACKEND_URL=http://localhost:3201
```

