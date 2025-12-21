# Invoice Entity

> Invoices represent payment tracking for completed jobs.

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Code Prefix** | INV- |
| **Table Name** | `invoices` |
| **Color** | Green (`#E8F5E9` / `#4CAF50`) |
| **Audited** | Yes |

Invoices are created from completed jobs and track payment status, due dates, and payment details.

---

## 🗄️ Database Schema

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  job_id UUID UNIQUE NOT NULL REFERENCES jobs(id),
  status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
  invoice_date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_note TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_job_id ON invoices(job_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
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
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Job } from './Job';

export enum InvoiceStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  invoiceNumber: string;

  @Column({ name: 'job_id', type: 'uuid', unique: true })
  jobId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: InvoiceStatus.UNPAID,
  })
  status: InvoiceStatus;

  @Column({ name: 'invoice_date', type: 'timestamptz' })
  invoiceDate: Date;

  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate: Date;

  @Column({ name: 'payment_note', type: 'text', nullable: true })
  paymentNote: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Job, (job) => job.invoice)
  @JoinColumn({ name: 'job_id' })
  job: Job;
}
```

---

## 🔗 Relationships

| Relation | Type | Entity | Description |
|----------|------|--------|-------------|
| job | 1:1 | Job | The completed job this invoice is for |
| creditNotes | 1:Many | CreditNote | Credit notes issued against this invoice |

### Cascade Rules
- Deleting a job: Prevents deletion if invoice exists (must delete invoice first)
- Invoice deletion: Updates job's `invoiceId` to null
- Credit note deletion: Cascades when invoice is deleted

---

## 🔄 Status Workflow

```
┌─────────┐
│ UNPAID  │ (Invoice created from completed job)
└────┬────┘
     │
     │ markAsPaid
     ▼
┌─────────┐
│  PAID   │ (Payment received)
└─────────┘
```

### Status Definitions

| Status | Description | Actions Available |
|--------|-------------|-------------------|
| UNPAID | Invoice created, awaiting payment | Mark as Paid, Print Invoice |
| PAID | Payment received | Print Invoice, View Payment Details |

---

## ✅ Business Rules

### Validation
| Field | Rule |
|-------|------|
| jobId | Required, must be a completed job, unique (one invoice per job) |
| invoiceNumber | Required, unique, auto-generated |
| invoiceDate | Required, defaults to creation date |
| dueDate | Required, calculated from invoiceDate + payment terms |
| status | Required, valid enum value |
| paymentNote | Optional, max 10000 characters |

### Code Generation
- Format: `INV-{yyMMdd}-{nnn}` (e.g., INV-241216-001, INV-241216-002)
- Date-based prefix with auto-incremented number
- Immutable after creation

### Business Logic
1. Only completed jobs can be converted to invoices
2. One invoice per job (enforced by unique constraint)
3. Due date calculated from invoice date + `invoice.payment_terms_days` setting (default: 14 days)
4. Invoice number is auto-generated on creation
5. When marked as paid, `paidAt` timestamp is set
6. Payment note is optional but recommended for audit trail
7. Credit notes can be issued to reduce the invoice balance
8. Remaining balance = Invoice total - Sum of all credit notes
9. Credit notes cannot exceed the invoice total

---

## 🌐 API Endpoints

### Create Invoice from Job
```
POST /api/invoices/from-job/:jobId
Response: Invoice (201 Created)
Error: 400 Bad Request if job is not completed
Error: 409 Conflict if invoice already exists
```

### Mark Invoice as Paid
```
PATCH /api/invoices/:id/pay
Body: { paymentNote?: string }
Response: Invoice
Error: 400 Bad Request if already paid
```

### Get Invoice
```
GET /api/invoices/:id
Response: Invoice (with job, customer, vehicle, lineItems)
```

### Get Invoice by Job
```
GET /api/invoices/job/:jobId
Response: Invoice | null
```

### List Invoices
```
GET /api/invoices
Query: ?status=UNPAID|PAID&page=1&limit=50
Response: { data: Invoice[], total: number, page: number, limit: number }
```

### Create Credit Note
```
POST /api/invoices/:id/credit-notes
Body: { amount: number, reason?: string, creditDate?: string }
Response: CreditNote (201 Created)
Error: 400 Bad Request if amount exceeds remaining balance
Error: 404 Not Found if invoice doesn't exist
```

### Get Credit Notes for Invoice
```
GET /api/invoices/:id/credit-notes
Response: CreditNote[]
Error: 404 Not Found if invoice doesn't exist
```

### Get Remaining Balance
```
GET /api/invoices/:id/remaining-balance
Response: { remainingBalance: number }
Error: 404 Not Found if invoice doesn't exist
```

---

## 🖥️ UI Components

### Invoice Section (Job Detail Page)
- Invoice number display
- Status badge (UNPAID/PAID)
- Invoice date and due date
- Invoice total amount
- Credit notes list (if any)
- Remaining balance calculation
- "Issue Credit Note" button
- "Convert to Invoice" button (for completed jobs without invoice)
- "Mark as Paid" button (for unpaid invoices)
- Payment note display (if provided)

### Payment Dialog
- Payment note input (optional)
- Confirmation button
- Closes and updates invoice status

### Invoice List (Future)
- Table view of all invoices
- Filter by status (UNPAID/PAID)
- Sort by date, due date, amount
- Export functionality

---

## 💰 Payment Flow

### Step 1: Job Completion
1. Job status transitions to `COMPLETED`
2. Job detail page shows "Convert to Invoice" button

### Step 2: Create Invoice
1. Click "Convert to Invoice"
2. System creates invoice with:
   - Auto-generated invoice number
   - Invoice date = today
   - Due date = today + payment terms days
   - Status = UNPAID
3. Job's `invoiceId` is updated to link to the invoice

### Step 3: Issue Credit Notes (Optional)
1. Click "Issue Credit Note" button
2. Credit note dialog opens
3. Enter credit amount (cannot exceed remaining balance)
4. Enter reason (optional, e.g., "Returned unused parts", "Warranty adjustment")
5. Select credit date (defaults to today)
6. Confirm
7. Credit note is created and reduces remaining balance
8. Can issue multiple credit notes until balance reaches zero

### Step 4: Payment Received
1. Click "Mark as Paid" button
2. Payment dialog opens
3. Enter payment note (optional, e.g., "Paid via credit card", "Check #1234")
4. Confirm
5. Invoice status → PAID
6. `paidAt` timestamp set
7. Payment note saved

---

## 📊 Related Reports

- Unpaid invoices report
- Overdue invoices (due date passed, status = UNPAID)
- Payment history
- Revenue by period (from paid invoices)
- Average days to payment

---

## 💡 Example

```
Job: J241216001
Status: COMPLETED
Total: $450.00

↓ Convert to Invoice

Invoice: INV-241216-001
Status: UNPAID
Invoice Date: 2024-12-16
Due Date: 2024-12-30 (14 days)
Amount: $450.00

↓ Issue Credit Note

Credit Note: CN-241216-001
Amount: $50.00
Reason: "Returned unused parts"
Remaining Balance: $400.00

↓ Payment Received

Invoice: INV-241216-001
Status: PAID
Paid Date: 2024-12-18
Payment Note: "Paid via credit card ending in 1234"
Final Amount Paid: $400.00 (after credit note)
```

---

*See also: [Job](./job.md) | [CreditNote](./credit-note.md) | [Settings](./settings.md)*

