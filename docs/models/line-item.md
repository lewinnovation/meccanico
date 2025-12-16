# LineItem Entity

> Line items are individual entries within a job representing inventory, labour, services, or custom text.

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Code Prefix** | None (subordinate entity) |
| **Table Name** | `line_items` |
| **Color** | Inherits from type |
| **Audited** | Via parent Job |

Line items connect jobs to the catalog (inventory, labour, services) or allow free-form text entries. They track quantity, pricing, and can be reordered within a job.

---

## 🗄️ Database Schema

```sql
CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  reference_id UUID,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_line_items_job_id ON line_items(job_id);
CREATE INDEX idx_line_items_type ON line_items(type);
CREATE INDEX idx_line_items_reference_id ON line_items(reference_id);
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
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Job } from './Job';

export enum LineItemType {
  INVENTORY = 'INVENTORY',
  LABOUR = 'LABOUR',
  SERVICE = 'SERVICE',
  TEXT = 'TEXT',
}

@Entity('line_items')
export class LineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id', type: 'uuid' })
  jobId: string;

  @Column({ type: 'varchar', length: 20 })
  type: LineItemType;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Job, (job) => job.lineItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  // Computed
  get total(): number {
    return this.quantity * this.unitPrice;
  }
}
```

---

## 🔗 Relationships

| Relation | Type | Entity | Description |
|----------|------|--------|-------------|
| job | N:1 | Job | Parent job |
| reference | N:1 | Inventory/Labour/Service | Source catalog item (optional) |

### Type-Reference Mapping

| Type | Reference Entity | Reference Required |
|------|------------------|-------------------|
| INVENTORY | Inventory | Optional* |
| LABOUR | Labour | Optional* |
| SERVICE | Service | Optional* |
| TEXT | None | No |

*Reference is optional to allow custom/one-off entries

---

## 🎨 Type Styling

| Type | Color | Badge Text |
|------|-------|------------|
| INVENTORY | Blue `#1976D2` | "Part" |
| LABOUR | Orange `#F57C00` | "Labour" |
| SERVICE | Green `#388E3C` | "Service" |
| TEXT | Gray `#424242` | "Custom" |

---

## ✅ Business Rules

### Validation
| Field | Rule |
|-------|------|
| jobId | Required, must exist |
| type | Required, valid enum |
| referenceId | Optional, must exist if provided |
| description | Required, 1-500 characters |
| quantity | Required, > 0 |
| unitPrice | Required, >= 0 |
| sortOrder | Auto-managed |
| notes | Optional, max 1000 characters |

### Business Logic

1. **Price Inheritance**
   - When referenceId is set, unitPrice defaults to catalog price
   - Price can be overridden per line item
   - Catalog price changes don't affect existing line items

2. **Description Inheritance**
   - When referenceId is set, description defaults to catalog name
   - Description can be overridden per line item

3. **Quantity Handling**
   - Inventory: Whole numbers or decimals (e.g., 2.5 liters)
   - Labour: Typically hours (e.g., 1.5 hours)
   - Service: Usually 1
   - Text: Typically 1, but flexible

4. **Editing Restrictions**
   - Line items are fully editable when job is ESTIMATE
   - Line items are locked when job is IN_PROGRESS or beyond
   - Admin can unlock for corrections

5. **Sort Order**
   - New items added to end
   - Can be reordered via drag-and-drop
   - Sort order persists across sessions

---

## 🌐 API Endpoints

### List Line Items (for Job)
```
GET /api/jobs/:jobId/line-items
Response: LineItem[]
```

### Add Line Item
```
POST /api/jobs/:jobId/line-items
Body: { type, referenceId?, description?, quantity?, unitPrice?, notes? }
Response: LineItem (201 Created)
```

### Update Line Item
```
PATCH /api/jobs/:jobId/line-items/:id
Body: { description?, quantity?, unitPrice?, notes? }
Response: LineItem
```

### Delete Line Item
```
DELETE /api/jobs/:jobId/line-items/:id
Response: 204 No Content
```

### Reorder Line Items
```
POST /api/jobs/:jobId/line-items/reorder
Body: { items: [{ id, sortOrder }] }
Response: LineItem[]
```

### Add from Catalog (Bulk)
```
POST /api/jobs/:jobId/line-items/bulk
Body: { items: [{ type, referenceId, quantity? }] }
Response: LineItem[]
```

---

## 🖥️ UI Components

### LineItemRow
- Inline editing
- Type badge with color
- Quantity input
- Price input
- Total display
- Delete button
- Drag handle

### LineItemForm
- Type selector
- Catalog search (fuzzy)
- Custom description input
- Quantity input
- Price override
- Notes field

### LineItemTable
- Sortable rows
- Column totals
- Type grouping option
- Bulk selection
- Keyboard navigation

### CatalogSearchModal
- Unified search across I/L/S
- Type filter tabs
- Recent items
- Keyboard shortcuts (`/I`, `/L`, `/S`)
- Multi-select mode

---

## 🔍 Type-Specific Behaviors

### INVENTORY
```typescript
{
  type: 'INVENTORY',
  referenceId: 'uuid-of-inventory-item',
  description: 'Brake Pad Set - Front',  // From catalog or custom
  quantity: 2,                             // Number of units
  unitPrice: 45.00,                        // Per-unit price
}
```
- Shows inventory code (I001) in UI
- Can decrement stock on completion
- Supports partial quantities (fluids, etc.)

### LABOUR
```typescript
{
  type: 'LABOUR',
  referenceId: 'uuid-of-labour-rate',
  description: 'Brake Replacement Labor',
  quantity: 1.5,                           // Hours
  unitPrice: 80.00,                        // Hourly rate
}
```
- Shows labour code (L001) in UI
- Quantity typically represents hours
- Can use flat rate (quantity = 1, price = flat amount)

### SERVICE
```typescript
{
  type: 'SERVICE',
  referenceId: 'uuid-of-service',
  description: 'Oil Change Package',
  quantity: 1,
  unitPrice: 35.00,                        // Package price
}
```
- Shows service code (S001) in UI
- Usually quantity = 1
- Price includes bundled items

### TEXT
```typescript
{
  type: 'TEXT',
  referenceId: null,                       // No reference
  description: 'Environmental disposal fee',
  quantity: 1,
  unitPrice: 5.00,
}
```
- No catalog reference
- Free-form description
- For one-off charges, notes, etc.

---

## 💡 UI Interaction Flow

```
1. User clicks "Add Item" or presses keyboard shortcut
   │
   ├─▶ Type selector appears
   │   ├─ /I → Inventory search
   │   ├─ /L → Labour search
   │   ├─ /S → Service search
   │   └─ /T → Text entry
   │
   ├─▶ For catalog types:
   │   ├─ Fuzzy search modal opens
   │   ├─ User searches/selects item
   │   ├─ Description and price auto-fill
   │   └─ User adjusts quantity
   │
   └─▶ For text type:
       ├─ Inline form opens
       ├─ User enters description
       └─ User enters price

2. Line item added to job
   │
   ├─ Job subtotal recalculates
   └─ Sort order assigned (end of list)

3. User can reorder via drag-and-drop
```

---

*See also: [Job](./job.md) | [Inventory](./inventory.md) | [Labour](./labour.md) | [Service](./service.md)*

