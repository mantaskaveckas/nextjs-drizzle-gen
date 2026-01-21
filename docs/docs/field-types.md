---
id: field-types
title: Field Types
sidebar_position: 4
---

# Field Types

## Basic Types

| Type | SQLite | PostgreSQL | MySQL |
|------|--------|------------|-------|
| `string` | text | text | varchar(255) |
| `text` | text | text | text |
| `integer` / `int` | integer | integer | int |
| `bigint` | integer | bigint | bigint |
| `boolean` / `bool` | integer (mode: boolean) | boolean | boolean |
| `float` | real | doublePrecision | double |
| `decimal` | text | numeric | decimal |
| `datetime` / `timestamp` | integer (mode: timestamp) | timestamp | datetime |
| `date` | integer (mode: timestamp) | date | date |
| `json` | text | jsonb | json |
| `uuid` | text | uuid | varchar(36) |

## Special Types

### Enum

Define a field with a fixed set of allowed values:

```bash
brizzle model order status:enum:pending,paid,shipped,delivered
```

**SQLite:**
```typescript
status: text("status", { enum: ["pending", "paid", "shipped", "delivered"] }).notNull()
```

**PostgreSQL:**
```typescript
export const statusEnum = pgEnum("status", ["pending", "paid", "shipped", "delivered"]);
// ...
status: statusEnum("status").notNull()
```

**MySQL:**
```typescript
status: mysqlEnum("status", ["pending", "paid", "shipped", "delivered"]).notNull()
```

### References

Create a foreign key reference to another table:

```bash
brizzle model comment authorId:references:user postId:references:post
```

Generates:
```typescript
authorId: integer("author_id").references(() => users.id).notNull(),
postId: integer("post_id").references(() => posts.id).notNull()
```

The reference target is automatically pluralized (e.g., `user` → `users`).

## Field Modifiers

### Nullable (`?`)

Make a field optional by adding `?` to the field name or type:

```bash
# These are equivalent:
brizzle model user bio:text?
brizzle model user bio?:text
```

Without `?`, fields are `notNull()` by default.

### Unique (`:unique`)

Add a unique constraint:

```bash
brizzle model user email:string:unique
```

Generates:
```typescript
email: text("email").notNull().unique()
```

### Combined Modifiers

You can combine nullable and unique:

```bash
brizzle model user email:string:unique nickname?:unique
```

## Field Syntax

The full field syntax is:

```
name[?][:type[?]][:modifier][:enum_values]
```

### Examples

| Definition | Result |
|------------|--------|
| `title` | `title: text, notNull` |
| `title:string` | `title: text, notNull` |
| `bio:text?` | `bio: text, nullable` |
| `bio?` | `bio: text, nullable` |
| `email:string:unique` | `email: text, notNull, unique` |
| `role:enum:admin,user` | `role: enum["admin","user"], notNull` |
| `userId:references:user` | `userId: integer, references users.id, notNull` |

## Default Values

All generated models include:

- **id**: Auto-incrementing integer (or UUID with `--uuid`)
- **createdAt**: Timestamp, defaults to current time
- **updatedAt**: Timestamp, defaults to current time

Disable timestamps with `--no-timestamps`.
