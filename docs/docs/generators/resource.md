---
id: resource
title: Resource Generator
sidebar_position: 4
---

# Resource Generator

Creates model + actions without UI pages. Ideal for backend-only resources.

## Usage

```bash
brizzle resource <name> [fields...]
```

## Example

```bash
brizzle resource session token:uuid userId:references:user --uuid
```

### Output

```
      create  db/schema.ts
      create  app/sessions/actions.ts
```

## When to Use

Use the resource generator when you need:

- **Backend-only models**: Resources that don't need a user interface
- **API-driven apps**: When you'll build custom UI or use the API generator
- **Internal models**: Session tokens, audit logs, background job records
- **Relationships**: Models that are managed through parent resources

## Examples

### Session Management

```bash
brizzle resource session token:uuid userId:references:user expiresAt:datetime --uuid
```

### Audit Logging

```bash
brizzle resource auditLog action:string entityType:string entityId:integer userId:references:user metadata:json
```

### Background Jobs

```bash
brizzle resource job type:string payload:json status:enum:pending,running,completed,failed attempts:integer
```

## Difference from Scaffold

| Feature | Resource | Scaffold |
|---------|----------|----------|
| Model | Yes | Yes |
| Actions | Yes | Yes |
| List page | No | Yes |
| New page | No | Yes |
| Detail page | No | Yes |
| Edit page | No | Yes |

## Options

| Option | Description |
|--------|-------------|
| `-f, --force` | Overwrite existing files |
| `-n, --dry-run` | Preview without writing |
| `-u, --uuid` | Use UUID for primary key |
| `--no-timestamps` | Skip createdAt/updatedAt |
