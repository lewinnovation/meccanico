# Inventory Entity

> Inventory items represent parts, materials, and consumables available for use in jobs.

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Code Prefix** | I |
| **Table Name** | `inventory` |
| **Color** | Blue (`#E3F2FD` / `#1976D2`) |
| **Audited** | Yes (price changes) |

Inventory items form the parts catalog. They can be added to jobs as line items, tracked for stock levels, and organized by category.

---

## 🗄️ Database Schema

```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100),
  unit_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  quantity_in_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 0,
  category VARCHAR(100),
  unit VARCHAR(50) DEFAULT 'each',
  is_active BOOLEAN DEFAULT true,
  version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_code ON inventory(code);
CREATE INDEX idx_inventory_name ON inventory(name);
CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_is_active ON inventory(is_active);
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

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: 'cost_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number | null;

  @Column({ name: 'quantity_in_stock', type: 'integer', default: 0 })
  quantityInStock: number;

  @Column({ name: 'minimum_stock', type: 'integer', default: 0 })
  minimumStock: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 50, default: 'each' })
  unit: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed
  get margin(): number | null {
    if (!this.costPrice) return null;
    return ((this.unitPrice - this.costPrice) / this.unitPrice) * 100;
  }

  get isLowStock(): boolean {
    return this.quantityInStock <= this.minimumStock;
  }
}
```

---

## 🔗 Relationships

| Relation | Type | Entity | Description |
|----------|------|--------|-------------|
| lineItems | 1:N | LineItem | Jobs using this item |
| serviceItems | 1:N | ServiceItem | Services including this item |
| templateItems | 1:N | TemplateItem | Templates including this item |

---

## ✅ Business Rules

### Validation
| Field | Rule |
|-------|------|
| name | Required, 1-255 characters |
| description | Optional, max 2000 characters |
| sku | Optional, 1-100 characters, unique if provided |
| unitPrice | Required, >= 0 |
| costPrice | Optional, >= 0 |
| quantityInStock | >= 0 |
| minimumStock | >= 0 |
| category | Optional, 1-100 characters |
| unit | Required, 1-50 characters |

### Code Generation
- Format: `I{NNN}` (e.g., I001, I042)
- Auto-incremented on creation
- Immutable after creation

### Business Logic
1. SKU must be unique if provided
2. Price changes are audited
3. Stock quantity can go negative (backorder scenario)
4. Inactive items hidden from search but remain in historical jobs
5. Deleting an item with usage history converts to inactive

### Stock Management
- Manual stock adjustment
- Optional: Auto-decrement on job completion
- Low stock alerts when quantity <= minimumStock

---

## 🌐 API Endpoints

### List Inventory
```
GET /api/inventory
Query: ?search=&category=&lowStock=&active=&page=1&limit=50&sort=name&order=asc
Response: { data: Inventory[], total: number, page: number }
```

### Get Inventory Item
```
GET /api/inventory/:id
Response: Inventory
```

### Create Inventory Item
```
POST /api/inventory
Body: { name, description?, sku?, unitPrice, costPrice?, quantityInStock?, minimumStock?, category?, unit? }
Response: Inventory (201 Created)
```

### Update Inventory Item
```
PATCH /api/inventory/:id
Body: { name?, description?, sku?, unitPrice?, costPrice?, minimumStock?, category?, unit?, isActive?, version? }
Response: Inventory
Error: 409 Conflict if version mismatch (optimistic locking)
```

### Delete Inventory Item
```
DELETE /api/inventory/:id
Response: 204 No Content (deactivates if has usage history)
```

### Adjust Stock
```
POST /api/inventory/:id/adjust-stock
Body: { adjustment: number, reason?: string }
Response: Inventory
```

### Get Categories
```
GET /api/inventory/categories
Response: string[]
```

### Bulk Import
```
POST /api/inventory/import
Body: CSV file
Response: { imported: number, errors: ImportError[] }
```

---

## 🖥️ UI Components

### InventoryList
- Table view with columns: Code, Name, Category, Price, Stock
- Low stock highlight (red/yellow)
- Category filter sidebar
- Quick search
- Bulk actions

### InventoryCard
- Compact item summary
- Stock indicator
- Price display
- Category badge

### InventoryForm
- Create/Edit form
- Category autocomplete
- Price and cost inputs
- Stock management section
- Unit selector

### InventoryDetail
- Full item information
- Usage history (jobs containing this item)
- Stock level graph
- Price history

### StockAdjustmentModal
- Current stock display
- Adjustment input (+/-)
- Reason field
- Confirmation

---

## 🔍 Search & Filter

### Searchable Fields
- `name` (fuzzy match)
- `code` (exact)
- `sku` (exact or partial)
- `description` (full-text)

### Filter Options
- Category (multi-select)
- Low stock only
- Active/Inactive
- Price range

### Sort Options
- Name (A-Z, Z-A)
- Code
- Price (low-high, high-low)
- Stock level
- Category

---

## 📊 Related Reports

- Inventory list export (CSV)
- Low stock report
- Stock valuation (quantity × cost)
- Usage frequency report
- Margin analysis

---

## 🏷️ Common Categories

Suggested default categories (configurable):
- Filters & Fluids
- Brakes
- Engine Parts
- Electrical
- Suspension
- Exhaust
- Body Parts
- Tires & Wheels
- Consumables
- Miscellaneous

---

## 📦 Unit Types

Common units:
- `each` - Individual items (default)
- `liter` / `gallon` - Fluids
- `meter` / `foot` - Length items
- `kg` / `lb` - Weight items
- `set` - Paired items (brake pads, etc.)

---

*See also: [LineItem](./line-item.md) | [Service](./service.md) | [Template](./template.md)*

