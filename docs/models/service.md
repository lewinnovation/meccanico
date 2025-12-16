# Service Entity

> Services represent bundled packages combining inventory, labour, and other items.

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Code Prefix** | S |
| **Table Name** | `services` |
| **Color** | Green (`#E8F5E9` / `#388E3C`) |
| **Audited** | Yes (price changes) |

Services are pre-defined packages that bundle inventory items, labour, and other charges into a single sellable unit with a fixed price.

---

## 🗄️ Database Schema

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL,
  item_id UUID NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_code ON services(code);
CREATE INDEX idx_services_name ON services(name);
CREATE INDEX idx_service_items_service_id ON service_items(service_id);
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
} from 'typeorm';
import { ServiceItem } from './ServiceItem';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ServiceItem, (item) => item.service, { cascade: true })
  items: ServiceItem[];

  // Computed: total component cost
  get componentCost(): number {
    return this.items?.reduce((sum, item) => sum + item.subtotal, 0) ?? 0;
  }
}
```

---

## ✅ Business Rules

### Validation
| Field | Rule |
|-------|------|
| name | Required, 1-255 characters |
| description | Optional, max 2000 characters |
| basePrice | Required, >= 0 |
| category | Optional, 1-100 characters |

### Business Logic
1. Service price is independent of component costs
2. Components are informational (not auto-added to job)
3. When added to job, creates single SERVICE line item
4. Price changes audited
5. Inactive services hidden from search

---

## 🌐 API Endpoints

### List Services
```
GET /api/services
Query: ?search=&category=&active=&page=1&limit=50
Response: { data: Service[], total: number }
```

### Create Service
```
POST /api/services
Body: { name, description?, basePrice, category?, items?: [] }
Response: Service (201 Created)
```

### Update Service
```
PATCH /api/services/:id
Body: { name?, description?, basePrice?, category?, isActive? }
Response: Service
```

---

*See also: [LineItem](./line-item.md) | [Inventory](./inventory.md) | [Labour](./labour.md)*

