# Labour Entity

> Labour items represent work rates for different types of labor performed in the shop.

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Code Prefix** | L |
| **Table Name** | `labour` |
| **Color** | Orange (`#FFF3E0` / `#F57C00`) |
| **Audited** | Yes (rate changes) |

Labour items define standard rates for different types of work. They can be hourly-based or flat-rate and are added to jobs as line items.

---

## 🗄️ Database Schema

```sql
CREATE TABLE labour (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL,
  default_hours DECIMAL(5,2) DEFAULT 1,
  is_flat_rate BOOLEAN DEFAULT false,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_labour_code ON labour(code);
CREATE INDEX idx_labour_name ON labour(name);
CREATE INDEX idx_labour_category ON labour(category);
CREATE INDEX idx_labour_is_active ON labour(is_active);
```

---

## 🔷 TypeORM Entity

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('labour')
export class Labour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2 })
  hourlyRate: number;

  @Column({ name: 'default_hours', type: 'decimal', precision: 5, scale: 2, default: 1 })
  defaultHours: number;

  @Column({ name: 'is_flat_rate', type: 'boolean', default: false })
  isFlatRate: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed
  get defaultTotal(): number {
    return this.isFlatRate ? this.hourlyRate : this.hourlyRate * this.defaultHours;
  }
}
```

---

## 🔗 Relationships

| Relation | Type | Entity | Description |
|----------|------|--------|-------------|
| lineItems | 1:N | LineItem | Jobs using this labour type |
| serviceItems | 1:N | ServiceItem | Services including this labour |
| templateItems | 1:N | TemplateItem | Templates including this labour |

---

## ✅ Business Rules

### Validation
| Field | Rule |
|-------|------|
| name | Required, 1-255 characters |
| description | Optional, max 2000 characters |
| hourlyRate | Required, > 0 |
| defaultHours | Required, > 0 |
| category | Optional, 1-100 characters |

### Code Generation
- Format: `L{NNN}` (e.g., L001, L042)
- Auto-incremented on creation
- Immutable after creation

### Business Logic
1. Rate changes are audited
2. isFlatRate determines display:
   - true: Show as flat rate (hourlyRate = total)
   - false: Show as hours × rate
3. defaultHours is a suggestion, can be overridden on job
4. Inactive items hidden from search but remain in historical jobs
5. Deleting an item with usage history converts to inactive

---

## ⏱️ Pricing Models

### Hourly Rate (default)
```typescript
{
  name: 'General Labor',
  hourlyRate: 80.00,      // Per hour
  defaultHours: 1,        // Default 1 hour
  isFlatRate: false,
}
// In job: quantity = hours, unitPrice = hourlyRate
// Example: 2.5 hours × $80 = $200
```

### Flat Rate
```typescript
{
  name: 'Oil Change Labor',
  hourlyRate: 35.00,      // Flat rate (not per hour)
  defaultHours: 1,        // Always 1 for flat rate
  isFlatRate: true,
}
// In job: quantity = 1, unitPrice = 35.00
// Example: 1 × $35 = $35
```

---

## 🌐 API Endpoints

### List Labour
```
GET /api/labour
Query: ?search=&category=&active=&page=1&limit=50&sort=name&order=asc
Response: { data: Labour[], total: number, page: number }
```

### Get Labour Item
```
GET /api/labour/:id
Response: Labour
```

### Create Labour Item
```
POST /api/labour
Body: { name, description?, hourlyRate, defaultHours?, isFlatRate?, category? }
Response: Labour (201 Created)
```

### Update Labour Item
```
PATCH /api/labour/:id
Body: { name?, description?, hourlyRate?, defaultHours?, isFlatRate?, category?, isActive? }
Response: Labour
```

### Delete Labour Item
```
DELETE /api/labour/:id
Response: 204 No Content (deactivates if has usage history)
```

### Get Categories
```
GET /api/labour/categories
Response: string[]
```

---

## 🖥️ UI Components

### LabourList
- Table view with columns: Code, Name, Rate, Type, Category
- Flat rate vs hourly indicator
- Category filter
- Quick search

### LabourCard
- Compact labour summary
- Rate display (hourly or flat)
- Category badge

### LabourForm
- Create/Edit form
- Rate type toggle (hourly/flat)
- Default hours input
- Category autocomplete

### LabourDetail
- Full item information
- Usage history
- Rate history graph

---

## 🔍 Search & Filter

### Searchable Fields
- `name` (fuzzy match)
- `code` (exact)
- `description` (full-text)

### Filter Options
- Category (multi-select)
- Rate type (hourly/flat)
- Active/Inactive
- Rate range

### Sort Options
- Name (A-Z, Z-A)
- Code
- Rate (low-high, high-low)
- Category

---

## 📊 Related Reports

- Labour rate list export (CSV)
- Labour usage by type
- Revenue by labour type
- Average hours per labour type

---

## 🏷️ Common Categories

Suggested default categories (configurable):
- General Mechanical
- Electrical
- Diagnostics
- Body Work
- Inspection
- Maintenance
- Specialty

---

*See also: [LineItem](./line-item.md) | [Service](./service.md) | [Template](./template.md)*

