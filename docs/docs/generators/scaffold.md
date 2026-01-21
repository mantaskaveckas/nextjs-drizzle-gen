---
id: scaffold
title: Scaffold Generator
sidebar_position: 3
---

# Scaffold Generator

Creates a complete CRUD interface: model + actions + pages.

## Usage

```bash
brizzle scaffold <name> [fields...]
```

## Example

```bash
brizzle scaffold post title:string body:text published:boolean
```

### Output

```
Scaffolding Post...

      create  db/schema.ts
      create  app/posts/actions.ts
      create  app/posts/page.tsx
      create  app/posts/new/page.tsx
      create  app/posts/[id]/page.tsx
      create  app/posts/[id]/edit/page.tsx

Next steps:
  1. Run 'pnpm db:push' to update the database
  2. Run 'pnpm dev' and visit /posts
```

## Generated Files

### Model (`db/schema.ts`)

Drizzle schema definition with all fields.

### Actions (`app/posts/actions.ts`)

Server actions for CRUD operations:
- `getPosts()` - List all posts
- `getPost(id)` - Get single post
- `createPost(data)` - Create new post
- `updatePost(id, data)` - Update post
- `deletePost(id)` - Delete post

### List Page (`app/posts/page.tsx`)

Displays all records with:
- Link to each record's detail page
- Edit and Delete actions
- "New Post" button

### New Page (`app/posts/new/page.tsx`)

Form to create a new record with:
- Input fields for all model fields
- Proper input types based on field types
- Cancel button to go back

### Detail Page (`app/posts/[id]/page.tsx`)

Shows single record with:
- All field values
- Edit button
- Back button

### Edit Page (`app/posts/[id]/edit/page.tsx`)

Form to update a record with:
- Pre-filled input fields
- Proper input types
- Cancel button

## Form Field Types

The generator creates appropriate HTML inputs based on field types:

| Field Type | HTML Input |
|------------|------------|
| `string` | `<input type="text">` |
| `text` | `<textarea>` |
| `integer`, `int`, `bigint` | `<input type="number">` |
| `float` | `<input type="number" step="any">` |
| `decimal` | `<input type="number" step="0.01">` |
| `boolean` | `<input type="checkbox">` |
| `date` | `<input type="date">` |
| `datetime`, `timestamp` | `<input type="datetime-local">` |
| `json` | `<textarea>` |
| `enum` | `<select>` |

## Options

| Option | Description |
|--------|-------------|
| `-f, --force` | Overwrite existing files |
| `-n, --dry-run` | Preview without writing |
| `-u, --uuid` | Use UUID for primary key |
| `--no-timestamps` | Skip createdAt/updatedAt |

## Styling

Generated pages use Tailwind CSS classes with a minimal, clean design:
- Responsive max-width container
- Proper spacing and typography
- Hover states on interactive elements
- Form validation with required fields
