# User Entity

> Users represent mechanics and administrators who access the system.

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Code Prefix** | None |
| **Table Name** | `users` |
| **Audited** | Yes |

Users are the people who log into and use the system. They have roles that determine their access levels.

---

## 🗄️ Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'MECHANIC',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
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

export enum UserRole {
  ADMIN = 'ADMIN',
  MECHANIC = 'MECHANIC',
  VIEWER = 'VIEWER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, default: UserRole.MECHANIC })
  role: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

---

## 🔐 Roles & Permissions

| Role | Description |
|------|-------------|
| **ADMIN** | Full access - settings, user management, all jobs |
| **MECHANIC** | Standard access - own jobs, customers, vehicles |
| **VIEWER** | Read-only access to assigned jobs |

---

## 🌐 API Endpoints

### Authentication
```
POST /api/auth/login     - Login
POST /api/auth/logout    - Logout
POST /api/auth/refresh   - Refresh token
GET  /api/auth/me        - Current user
```

### User Management (Admin)
```
GET    /api/users           - List users
POST   /api/users           - Create user
PATCH  /api/users/:id       - Update user
DELETE /api/users/:id       - Deactivate user
```

---

*See also: [Job](./job.md) | [Settings](./settings.md)*

