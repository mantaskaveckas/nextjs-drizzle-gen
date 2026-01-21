---
id: actions
title: Actions Generator
sidebar_position: 2
---

# Actions Generator

Creates server actions file with CRUD operations for an existing model.

## Usage

```bash
brizzle actions <name>
```

## Example

```bash
brizzle actions user
```

Generates `app/users/actions.ts`:

```typescript
"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export async function getUsers() {
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUser(id: number) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createUser(data: Omit<NewUser, "id" | "createdAt" | "updatedAt">) {
  const result = await db.insert(users).values(data).returning();
  revalidatePath("/users");
  return result[0];
}

export async function updateUser(
  id: number,
  data: Partial<Omit<NewUser, "id" | "createdAt" | "updatedAt">>
) {
  const result = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  revalidatePath("/users");
  return result[0];
}

export async function deleteUser(id: number) {
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/users");
}
```

## Generated Functions

| Function | Description |
|----------|-------------|
| `get{Plural}()` | Fetch all records ordered by createdAt desc |
| `get{Singular}(id)` | Fetch single record by ID |
| `create{Singular}(data)` | Insert new record |
| `update{Singular}(id, data)` | Update existing record |
| `delete{Singular}(id)` | Delete record by ID |

## Features

- **Type Inference**: Uses Drizzle's `$inferSelect` and `$inferInsert` for type safety
- **Automatic Revalidation**: Calls `revalidatePath` after mutations
- **Timestamp Handling**: Automatically updates `updatedAt` on mutations

## Options

| Option | Description |
|--------|-------------|
| `-f, --force` | Overwrite existing actions file |
| `-n, --dry-run` | Preview without writing |

## When to Use

Use the actions generator when:

- You already have a model in your schema
- You want just the server actions without UI pages
- You're building a headless API or custom UI
