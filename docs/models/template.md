# Template Entity

> Templates are reusable job configurations that can be applied to quickly populate jobs.

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Code Prefix** | T |
| **Table Name** | `templates` |
| **Color** | Purple (`#F3E5F5` / `#7B1FA2`) |
| **Audited** | No |

Templates allow mechanics to save and reuse common job configurations, speeding up the creation of similar jobs.

---

## 🗄️ Database Schema

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL,
  item_id UUID,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_templates_code ON templates(code);
CREATE INDEX idx_templates_created_by ON templates(created_by);
CREATE INDEX idx_template_items_template_id ON template_items(template_id);
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
import { User } from './User';
import { TemplateItem } from './TemplateItem';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({ name: 'is_global', type: 'boolean', default: false })
  isGlobal: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => TemplateItem, (item) => item.template, { cascade: true })
  items: TemplateItem[];
}
```

---

## ✅ Business Rules

1. Templates can be personal or global (admin)
2. Applying template copies items to job (doesn't link)
3. Template items store snapshot of prices at template creation
4. Code format: `T{NNN}` (e.g., T001)

---

## 🌐 API Endpoints

### List Templates
```
GET /api/templates
Query: ?search=&mine=&page=1&limit=50
Response: { data: Template[], total: number }
```

### Apply Template to Job
```
POST /api/jobs/:jobId/apply-template/:templateId
Response: Job (with new line items)
```

---

*See also: [Job](./job.md) | [LineItem](./line-item.md)*

