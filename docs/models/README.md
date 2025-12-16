# Domain Models

> Complete specification of all domain entities in the Meccanico platform.

---

## 📊 Entity Overview

| Entity | Code | Table | Description |
|--------|------|-------|-------------|
| [Customer](./customer.md) | C | `customers` | Client records |
| [Vehicle](./vehicle.md) | V | `vehicles` | Vehicle records linked to customers |
| [Job](./job.md) | J | `jobs` | Work orders from estimate to invoice |
| [LineItem](./line-item.md) | - | `line_items` | Items within a job |
| [Inventory](./inventory.md) | I | `inventory` | Parts and materials catalog |
| [Labour](./labour.md) | L | `labour` | Labor rate catalog |
| [Service](./service.md) | S | `services` | Service package catalog |
| [Template](./template.md) | T | `templates` | Reusable job templates |
| [User](./user.md) | - | `users` | Mechanic/admin accounts |
| [Settings](./settings.md) | - | `settings` | System configuration |

---

## 🔗 Entity Relationships

```
                                    ┌─────────────┐
                                    │    User     │
                                    │  (Mechanic) │
                                    └──────┬──────┘
                                           │ assigns
                                           ▼
┌─────────────┐    1:N    ┌─────────────┐    1:N    ┌─────────────┐
│  Customer   │──────────▶│   Vehicle   │──────────▶│     Job     │
│     (C)     │           │     (V)     │           │     (J)     │
└─────────────┘           └─────────────┘           └──────┬──────┘
                                                          │
                                                          │ contains
                                                          ▼
                                                   ┌─────────────┐
                                                   │  LineItem   │
                                                   └──────┬──────┘
                                                          │
                          ┌───────────────────────────────┼───────────────────────────────┐
                          │                               │                               │
                          ▼                               ▼                               ▼
                   ┌─────────────┐                 ┌─────────────┐                 ┌─────────────┐
                   │  Inventory  │                 │   Labour    │                 │   Service   │
                   │     (I)     │                 │     (L)     │                 │     (S)     │
                   └─────────────┘                 └─────────────┘                 └──────┬──────┘
                                                                                         │
                                                                                         │ composed of
                                                                                         ▼
                                                                                  ┌─────────────┐
                                                                                  │ServiceItem  │
                                                                                  │ (I, L refs) │
                                                                                  └─────────────┘

┌─────────────┐
│  Template   │──────▶ TemplateItem (references I, L, S)
│     (T)     │
└─────────────┘
```

---

## 🔑 Code Generation

Each entity with a public code follows this pattern:

| Entity | Pattern | Example | Auto-increment |
|--------|---------|---------|----------------|
| Customer | C{NNN} | C001, C002 | Yes |
| Vehicle | V{NNN} | V001, V002 | Yes |
| Job | J{NNN} | J001, J002 | Yes |
| Inventory | I{NNN} | I001, I002 | Yes |
| Labour | L{NNN} | L001, L002 | Yes |
| Service | S{NNN} | S001, S002 | Yes |
| Template | T{NNN} | T001, T002 | Yes |

**Code Rules:**
- Codes are unique per entity type
- Codes are human-readable and used in UI
- Codes are immutable once assigned
- Zero-padded to 3 digits (expandable)

---

## 📋 Common Fields

All entities include these base fields:

```typescript
interface BaseEntity {
  id: string;           // UUID primary key
  createdAt: Date;      // Record creation timestamp
  updatedAt: Date;      // Last update timestamp
}

interface CodedEntity extends BaseEntity {
  code: string;         // Human-readable code (I001, J002, etc.)
}
```

---

## 🎨 Entity Color Mapping

Used for visual distinction in the UI:

| Entity | Background | Border/Text | CSS Variable |
|--------|------------|-------------|--------------|
| Inventory | `#E3F2FD` | `#1976D2` | `--entity-inventory` |
| Labour | `#FFF3E0` | `#F57C00` | `--entity-labour` |
| Service | `#E8F5E9` | `#388E3C` | `--entity-service` |
| Template | `#F3E5F5` | `#7B1FA2` | `--entity-template` |
| Job | `#FFFDE7` | `#FBC02D` | `--entity-job` |
| Customer | `#FCE4EC` | `#C2185B` | `--entity-customer` |
| Vehicle | `#E0F2F1` | `#00796B` | `--entity-vehicle` |
| Text | `#FFFFFF` | `#424242` | `--entity-text` |

---

## 📄 Model Documentation Template

Each model document follows this structure:

```markdown
# Entity Name

## Overview
Brief description of the entity's purpose.

## Database Schema
Table definition with all columns.

## TypeORM Entity
TypeScript entity class definition.

## Relationships
Links to other entities.

## Business Rules
Validation and business logic constraints.

## API Endpoints
CRUD operations for this entity.

## UI Components
Frontend components that render this entity.

## Status Flow (if applicable)
State machine definition.
```

---

## 🔄 Audit Trail

Changes to key entities are logged:

```typescript
interface AuditLog {
  id: string;
  userId: string;        // Who made the change
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;    // 'Job', 'Customer', etc.
  entityId: string;      // ID of affected entity
  oldValue: object;      // Previous state (for UPDATE/DELETE)
  newValue: object;      // New state (for CREATE/UPDATE)
  createdAt: Date;
}
```

**Audited Entities:**
- Jobs (all changes)
- Customers (all changes)
- Vehicles (all changes)
- Inventory (price changes)
- Settings (all changes)

---

*Navigate to individual model files for detailed specifications.*

