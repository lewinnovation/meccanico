# Customer Entity

> Customer records represent clients who bring vehicles for service.

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Code Prefix** | C |
| **Table Name** | `customers` |
| **Color** | Pink (`#FCE4EC` / `#C2185B`) |
| **Audited** | Yes |

Customers are the top-level entity in the service chain. Each customer can have multiple vehicles, and each vehicle can have multiple jobs.

---

## 🗄️ Database Schema

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_email ON customers(email);
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
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { Vehicle } from './Vehicle';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Vehicle, (vehicle) => vehicle.customer)
  vehicles: Vehicle[];
}
```

---

## 🔗 Relationships

| Relation | Type | Entity | Description |
|----------|------|--------|-------------|
| vehicles | 1:N | Vehicle | Customer's registered vehicles |

### Cascade Rules
- Deleting a customer: **Soft delete** or **prevent** if vehicles exist
- Customer owns: Vehicles → Jobs → LineItems

---

## ✅ Business Rules

### Validation
| Field | Rule |
|-------|------|
| name | Required, 1-255 characters |
| email | Optional, valid email format |
| phone | Optional, 1-50 characters |
| address | Optional, max 1000 characters |
| notes | Optional, max 5000 characters |

### Code Generation
- Format: `C{5 letters of name in caps}{NNN}` (e.g., CJOHNS001, CALICE002)
- First 5 letters extracted from customer name (uppercase, only letters)
- Non-alphabetic characters (spaces, numbers, special chars) are removed
- Names shorter than 5 characters are padded with 'X' (e.g., "Bob" → CBOBXX001)
- Sequential number per name prefix
- Auto-generated on creation
- Immutable after creation
- Unique across all customers

#### Code Examples
| Customer Name | Generated Code |
|--------------|----------------|
| John Smith | CJOHNS001 |
| Alice | CALICE001 |
| Bob | CBOBXX001 |
| O'Brien | COBRIE001 |
| Ann-Marie Chen | CANNMA001 |

### Business Logic
1. Email must be unique if provided
2. Phone formatting is normalized on save
3. Customer cannot be deleted if they have jobs in progress
4. Customer history is retained even if marked inactive

---

## 🌐 API Endpoints

### List Customers
```
GET /api/customers
Query: ?search=&page=1&limit=50&sort=name&order=asc
Response: { data: Customer[], total: number, page: number }
```

### Get Customer
```
GET /api/customers/:id
Response: Customer (with vehicles)
```

### Create Customer
```
POST /api/customers
Body: { name, email?, phone?, address?, notes? }
Response: Customer (201 Created)
```

### Update Customer
```
PATCH /api/customers/:id
Body: { name?, email?, phone?, address?, notes? }
Response: Customer
```

### Delete Customer
```
DELETE /api/customers/:id
Response: 204 No Content
Error: 409 Conflict if has active jobs
```

### Get Customer Vehicles
```
GET /api/customers/:id/vehicles
Response: Vehicle[]
```

### Get Customer Jobs
```
GET /api/customers/:id/jobs
Query: ?status=&page=1&limit=50
Response: { data: Job[], total: number }
```

---

## 🖥️ UI Components

### CustomerList
- Table view with sortable columns
- Quick search by name/email/phone
- Inline customer code badge
- Click to view details

### CustomerCard
- Summary card showing customer info
- Vehicle count badge
- Active jobs indicator
- Quick actions (edit, add vehicle)

### CustomerForm
- Create/Edit form
- Field validation
- Phone number formatting
- Address autocomplete (optional)

### CustomerDetail
- Full customer information
- Vehicle list
- Job history timeline
- Notes section

---

## 🔍 Search & Filter

### Searchable Fields
- `name` (fuzzy match)
- `email` (exact or partial)
- `phone` (normalized)
- `code` (exact)

### Filter Options
- Has active jobs
- Has vehicles
- Created date range
- Last service date range

### Sort Options
- Name (A-Z, Z-A)
- Code (ascending, descending)
- Created date (newest, oldest)
- Last service date

---

## 📊 Related Reports

- Customer list export (CSV)
- Customer service history
- Customer spending summary
- Inactive customers report

---

*See also: [Vehicle](./vehicle.md) | [Job](./job.md)*

