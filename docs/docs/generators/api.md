---
id: api
title: API Generator
sidebar_position: 5
---

# API Generator

Creates model + REST API route handlers.

## Usage

```bash
brizzle api <name> [fields...]
```

## Example

```bash
brizzle api webhook url:string secret:string:unique
```

### Output

```
Generating API Webhook...

      create  db/schema.ts
      create  app/api/webhooks/route.ts
      create  app/api/webhooks/[id]/route.ts

Next steps:
  1. Run 'pnpm db:push' to update the database
  2. API available at /api/webhooks
```

## Generated Files

### Collection Route (`app/api/webhooks/route.ts`)

Handles collection-level operations:

```typescript
import { db } from "@/db";
import { webhooks } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/webhooks - List all
export async function GET() {
  try {
    const data = await db
      .select()
      .from(webhooks)
      .orderBy(desc(webhooks.createdAt));

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}

// POST /api/webhooks - Create new
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await db.insert(webhooks).values(body).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 }
    );
  }
}
```

### Member Route (`app/api/webhooks/[id]/route.ts`)

Handles individual record operations:

```typescript
import { db } from "@/db";
import { webhooks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/webhooks/:id - Get one
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  // ...
}

// PATCH /api/webhooks/:id - Update
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  // ...
}

// DELETE /api/webhooks/:id - Delete
export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  // ...
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{plural}` | List all records |
| POST | `/api/{plural}` | Create new record |
| GET | `/api/{plural}/:id` | Get single record |
| PATCH | `/api/{plural}/:id` | Update record |
| DELETE | `/api/{plural}/:id` | Delete record |

## Response Format

### Success Responses

```json
// GET /api/webhooks
[
  { "id": 1, "url": "https://...", "secret": "..." },
  { "id": 2, "url": "https://...", "secret": "..." }
]

// GET /api/webhooks/1
{ "id": 1, "url": "https://...", "secret": "..." }

// POST /api/webhooks (201 Created)
{ "id": 3, "url": "https://...", "secret": "..." }

// PATCH /api/webhooks/1
{ "id": 1, "url": "https://updated...", "secret": "..." }

// DELETE /api/webhooks/1 (204 No Content)
```

### Error Responses

```json
// 404 Not Found
{ "error": "Record not found" }

// 500 Internal Server Error
{ "error": "Failed to fetch records" }
```

## Options

| Option | Description |
|--------|-------------|
| `-f, --force` | Overwrite existing files |
| `-n, --dry-run` | Preview without writing |
| `-u, --uuid` | Use UUID for primary key |
| `--no-timestamps` | Skip createdAt/updatedAt |

## When to Use

Use the API generator when:

- Building a headless backend for mobile apps
- Creating a public API
- Integrating with external services
- Building microservices
