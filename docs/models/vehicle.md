# Vehicle Entity

> Vehicle records represent the cars/trucks brought in for service.

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Code Prefix** | V |
| **Table Name** | `vehicles` |
| **Color** | Teal (`#E0F2F1` / `#00796B`) |
| **Audited** | Yes |

Vehicles belong to customers and are the subject of jobs. Each vehicle maintains a complete service history.

---

## 🗄️ Database Schema

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER,
  vin VARCHAR(17),
  license_plate VARCHAR(20),
  color VARCHAR(50),
  mileage INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_code ON vehicles(code);
CREATE INDEX idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
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
import { Job } from './Job';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ type: 'varchar', length: 100 })
  make: string;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'integer', nullable: true })
  year: number | null;

  @Column({ type: 'varchar', length: 17, nullable: true })
  vin: string | null;

  @Column({ name: 'license_plate', type: 'varchar', length: 20, nullable: true })
  licensePlate: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string | null;

  @Column({ type: 'integer', nullable: true })
  mileage: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Customer, (customer) => customer.vehicles)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => Job, (job) => job.vehicle)
  jobs: Job[];
}
```

---

## 🔗 Relationships

| Relation | Type | Entity | Description |
|----------|------|--------|-------------|
| customer | N:1 | Customer | Owner of the vehicle |
| jobs | 1:N | Job | Service history |

### Cascade Rules
- Deleting a vehicle: **Soft delete** or **prevent** if jobs exist
- Vehicle inherits customer context

---

## ✅ Business Rules

### Validation
| Field | Rule |
|-------|------|
| customerId | Required, must exist |
| make | Required, 1-100 characters |
| model | Required, 1-100 characters |
| year | Optional, 1900-current year + 1 |
| vin | Optional, exactly 17 characters if provided |
| licensePlate | Optional, 1-20 characters |
| color | Optional, 1-50 characters |
| mileage | Optional, non-negative integer |
| notes | Optional, max 5000 characters |

### Code Generation
- Format: `V{NNN}` (e.g., V001, V042)
- Auto-incremented on creation
- Immutable after creation
- Unique across all vehicles

### Business Logic
1. VIN must be unique if provided
2. License plate should be unique if provided
3. Mileage should only increase over time (warn on decrease)
4. Vehicle cannot be deleted if it has jobs in progress
5. Vehicle can be transferred to different customer (with audit trail)

---

## 🌐 API Endpoints

### List Vehicles
```
GET /api/vehicles
Query: ?customerId=&search=&page=1&limit=50&sort=make&order=asc
Response: { data: Vehicle[], total: number, page: number }
```

### Get Vehicle
```
GET /api/vehicles/:id
Response: Vehicle (with customer, recent jobs)
```

### Create Vehicle
```
POST /api/vehicles
Body: { customerId, make, model, year?, vin?, licensePlate?, color?, mileage?, notes? }
Response: Vehicle (201 Created)
```

### Update Vehicle
```
PATCH /api/vehicles/:id
Body: { make?, model?, year?, vin?, licensePlate?, color?, mileage?, notes? }
Response: Vehicle
```

### Delete Vehicle
```
DELETE /api/vehicles/:id
Response: 204 No Content
Error: 409 Conflict if has active jobs
```

### Get Vehicle Jobs
```
GET /api/vehicles/:id/jobs
Query: ?status=&page=1&limit=50
Response: { data: Job[], total: number }
```

### Transfer Vehicle
```
POST /api/vehicles/:id/transfer
Body: { newCustomerId }
Response: Vehicle
```

---

## 🖥️ UI Components

### VehicleList
- Table view with make/model/year columns
- Customer name column
- License plate display
- Service history indicator

### VehicleCard
- Compact vehicle summary
- Make/model/year display
- License plate badge
- Job count indicator

### VehicleForm
- Create/Edit form
- VIN validation and lookup
- Year selector
- Mileage input with validation

### VehicleDetail
- Full vehicle specifications
- Customer info link
- Complete service history
- Mileage tracking graph

### VehicleSelector
- Dropdown/search for selecting vehicle
- Filtered by customer
- Shows recent vehicles first
- Quick "Add New" option

---

## 🔍 Search & Filter

### Searchable Fields
- `make` (fuzzy match)
- `model` (fuzzy match)
- `vin` (exact)
- `licensePlate` (exact or partial)
- `code` (exact)

### Filter Options
- Customer
- Make
- Year range
- Has active jobs
- Last service date range

### Sort Options
- Make/Model (A-Z, Z-A)
- Year (newest, oldest)
- Last service date
- Code

---

## 📊 Related Reports

- Vehicle list export (CSV)
- Service history by vehicle
- Mileage tracking report
- Vehicles by make/model statistics

---

*See also: [Customer](./customer.md) | [Job](./job.md)*

