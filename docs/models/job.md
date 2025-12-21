# Job Entity

> Jobs represent work orders that track vehicle service from estimate to completion.

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Code Prefix** | J |
| **Table Name** | `jobs` |
| **Color** | Yellow (`#FFFDE7` / `#FBC02D`) |
| **Audited** | Yes |

Jobs are the central entity of the system. They contain line items (inventory, labour, services, text) and progress through a defined workflow from estimate to paid invoice.

---

## 🗄️ Database Schema

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  assigned_to UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'BOOKED',
  notes TEXT,
  internal_notes TEXT,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  invoice_id UUID REFERENCES invoices(id),
  odometer INTEGER,
  odometer_unit VARCHAR(10),
  version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_code ON jobs(code);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_vehicle_id ON jobs(vehicle_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
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
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Customer } from './Customer';
import { Vehicle } from './Vehicle';
import { User } from './User';
import { LineItem } from './LineItem';

export enum JobStatus {
  BOOKED = 'BOOKED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  AWAITING_PICKUP = 'AWAITING_PICKUP',
  COMPLETED = 'COMPLETED',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId: string;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: JobStatus.BOOKED,
  })
  status: JobStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'internal_notes', type: 'text', nullable: true })
  internalNotes: string | null;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: number;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'invoice_id', type: 'uuid', nullable: true })
  invoiceId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignee: User;

  @OneToMany(() => LineItem, (lineItem) => lineItem.job, { cascade: true })
  lineItems: LineItem[];

  @OneToOne(() => Invoice, (invoice) => invoice.job, { nullable: true })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice | null;

  // Computed properties
  get subtotal(): number {
    return this.lineItems?.reduce((sum, item) => sum + item.total, 0) ?? 0;
  }

  get discountTotal(): number {
    if (this.discountAmount > 0) return this.discountAmount;
    if (this.discountPercent > 0) return this.subtotal * (this.discountPercent / 100);
    return 0;
  }

  get taxableAmount(): number {
    return this.subtotal - this.discountTotal;
  }

  get taxAmount(): number {
    return this.taxableAmount * (this.taxRate / 100);
  }

  get total(): number {
    return this.taxableAmount + this.taxAmount;
  }
}
```

---

## 🔗 Relationships

| Relation | Type | Entity | Description |
|----------|------|--------|-------------|
| customer | N:1 | Customer | Job's customer |
| vehicle | N:1 | Vehicle | Vehicle being serviced |
| assignee | N:1 | User | Mechanic assigned to job |
| lineItems | 1:N | LineItem | Items in the job |
| invoice | 1:1 | Invoice | Invoice created from completed job |

### Cascade Rules
- Deleting a job: Cascades to line items
- Customer/Vehicle deletion: Prevented if active jobs exist

---

## 🔄 Status Workflow

```
┌─────────┐
│ BOOKED  │ (Initial job created)
└────┬────┘
     │
     ├─────────────────────────────────────┐
     │                                     │
     ▼                                     ▼
┌─────────────┐                    ┌──────────┐
│IN_PROGRESS  │                    │ PENDING  │
└────┬────┬───┘                    └────┬─────┘
     │    │                              │
     │    └──────────────────────────────┘
     │
     ▼
┌──────────────┐
│AWAITING_PICKUP│
└──────┬───────┘
       │
       ▼
┌──────────┐
│COMPLETED │ → Can be converted to Invoice
└──────────┘
```

**Note:** Status transitions are flexible - any status can transition to any other status. The system allows for workflow flexibility based on shop needs.

### Status Definitions

| Status | Description | Editable | Can Delete | Can Convert to Invoice |
|--------|-------------|----------|------------|------------------------|
| BOOKED | Initial job created | ✅ Full | ✅ | ❌ |
| IN_PROGRESS | Work ongoing | 📝 Line items locked | ❌ | ❌ |
| PENDING | Work temporarily paused | 📝 Line items locked | ❌ | ❌ |
| AWAITING_PICKUP | Work complete, waiting for customer | 📝 Line items locked | ❌ | ❌ |
| COMPLETED | Work finished | 🔒 Locked | ❌ | ✅ |

### Status Transitions

The system supports flexible status transitions. Common workflows:

- **Standard Flow**: `BOOKED → IN_PROGRESS → AWAITING_PICKUP → COMPLETED`
- **With Hold**: `BOOKED → IN_PROGRESS → PENDING → IN_PROGRESS → COMPLETED`
- **Direct Completion**: `BOOKED → COMPLETED` (for quick jobs)

Once a job reaches `COMPLETED` status, it can be converted to an invoice for payment tracking.

---

## ✅ Business Rules

### Validation
| Field | Rule |
|-------|------|
| customerId | Required, must exist |
| vehicleId | Required, must belong to customer |
| assignedTo | Optional, must be valid user |
| status | Required, valid enum value |
| taxRate | 0-100, default from settings |
| discountAmount | Non-negative |
| discountPercent | 0-100 |
| notes | Optional, max 10000 characters |

### Code Generation
- Format: `J{yyMMdd}{nnn}` (e.g., J241216001, J241216002)
- Date-based prefix with auto-incremented number
- Immutable after creation

### Business Logic
1. Vehicle must belong to the specified customer
2. Cannot have both discountAmount and discountPercent
3. Line items locked when status is COMPLETED
4. Customer and vehicle can only be changed when status is BOOKED
5. Timestamps auto-set on status transitions (startedAt for IN_PROGRESS, completedAt for COMPLETED)
6. Tax rate defaults to shop setting but can be overridden
7. Odometer reading can be recorded when creating/updating jobs (optional)
8. When odometer is set on a job, a VehicleOdometerReading record is created with source='job'
9. Jobs can be duplicated (creates new BOOKED job)
10. Completed jobs can be converted to invoices

---

## 🌐 API Endpoints

### List Jobs
```
GET /api/jobs
Query: ?status=&customerId=&vehicleId=&assignedTo=&search=&page=1&limit=50&sort=createdAt&order=desc
Response: { data: Job[], total: number, page: number }
```

### Get Job
```
GET /api/jobs/:id
Response: Job (with customer, vehicle, lineItems, assignee)
```

### Create Job
```
POST /api/jobs
Body: { customerId, vehicleId, assignedTo?, notes?, taxRate?, odometer?, odometerUnit? }
Response: Job (201 Created)
```

### Update Job
```
PATCH /api/jobs/:id
Body: { assignedTo?, notes?, internalNotes?, taxRate?, discountAmount?, discountPercent?, dueDate?, odometer?, odometerUnit?, version? }
Response: Job
Error: 409 Conflict if version mismatch (optimistic locking)
```

### Update Job Status
```
POST /api/jobs/:id/status
Body: { status }
Response: Job
```

### Delete Job
```
DELETE /api/jobs/:id
Response: 204 No Content
Error: 409 Conflict if not in BOOKED status
```

### Duplicate Job
```
POST /api/jobs/:id/duplicate
Response: Job (new BOOKED)
```

### Add Line Item
```
POST /api/jobs/:id/line-items
Body: { type, referenceId?, description?, quantity, unitPrice? }
Response: LineItem (201 Created)
```

### Get Job PDF
```
GET /api/jobs/:id/pdf?type=estimate|invoice
Response: PDF file
```

---

## 🖥️ UI Components

### JobList
- Table/Kanban view toggle
- Status filter tabs
- Assignee filter
- Date range filter
- Bulk actions

### JobCard
- Compact summary
- Status badge (color-coded)
- Customer/Vehicle info
- Total amount
- Due date indicator

### JobDetail
- Full job information
- Line items management
- Status controls
- Notes section
- Action history

### JobForm
- Create/Edit form
- Customer/Vehicle selector
- Quick customer creation
- Template application

### LineItemManager
- Add/Edit/Remove line items
- Type selector (I/L/S/Text)
- Quantity and price inputs
- Drag-and-drop reorder
- Subtotal display

### StatusTransitionButton
- Context-aware next actions
- Confirmation dialogs
- Status history

---

## 🔍 Search & Filter

### Searchable Fields
- `code` (exact)
- Customer name
- Vehicle make/model
- Notes content

### Filter Options
- Status (multi-select)
- Assigned mechanic
- Customer
- Date range (created, due, completed)
- Amount range

### Sort Options
- Created date
- Due date
- Status
- Total amount
- Code

---

## 📊 Related Reports

- Jobs list export (CSV)
- Revenue by period
- Jobs by status
- Mechanic productivity
- Average job duration
- Customer job history

---

## 💰 Calculation Example

```
Line Items:
  - Brake pads (I)      2 × $45.00  = $90.00
  - Labor (L)           1.5 × $80.00 = $120.00
  - Oil change (S)      1 × $35.00  = $35.00
  - Disposal fee (Text) 1 × $5.00   = $5.00
                        ─────────────────────
Subtotal:                             $250.00
Discount (10%):                       -$25.00
                        ─────────────────────
Taxable:                              $225.00
Tax (8%):                              $18.00
                        ─────────────────────
Total:                                $243.00
```

---

---

## 💳 Invoice Relationship

When a job reaches `COMPLETED` status, it can be converted to an invoice for payment tracking. The invoice is a separate entity that tracks:

- Invoice number (format: `INV-{yyMMdd}-{nnn}`)
- Invoice date
- Due date (calculated from payment terms setting)
- Payment status (UNPAID/PAID)
- Payment note (optional payment method/details)
- Paid date (when payment was received)

The job maintains a one-to-one relationship with its invoice via the `invoiceId` foreign key.

*See also: [LineItem](./line-item.md) | [Customer](./customer.md) | [Vehicle](./vehicle.md) | [Invoice](./invoice.md)*

