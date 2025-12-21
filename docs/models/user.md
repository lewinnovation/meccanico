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
  VersionColumn,
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

  @VersionColumn()
  version: number;
}
```

---

## 🔐 Roles & Permissions

| Role | Description |
|------|-------------|
| **ADMIN** | Full access - settings, user management, all jobs |
| **MECHANIC** | Standard access - own jobs, customers, vehicles |
| **VIEWER** | Read-only access to assigned jobs |

## 👤 User Management

### Admin Functions

Admins can manage user accounts through the Settings > User Management page:

- **Create User**: Create new user accounts with email, name, and role. A random password is generated and sent to the user's email.
- **Suspend User**: Deactivate a user account. The user cannot log in until reactivated. An email notification is sent.
- **Activate User**: Reactivate a suspended user account.
- **Reset Password**: Generate a new random password and send it to the user via email. The admin does not see the password.
- **Delete User**: Users cannot be deleted if they have:
  - Audit log entries
  - Assigned jobs
  - Created templates

### Profile Management

All authenticated users can update their own profile:

- **Update Name**: Change display name
- **Update Password**: Change password (requires current password verification)

Users can access their profile by clicking on their name/email in the sidebar.

## 📧 Email Templates

User management operations use communication templates:

- **EMAIL_NEW_ACCOUNT**: Sent when a new user account is created
- **EMAIL_PASSWORD_RESET**: Sent when an admin resets a user's password
- **EMAIL_ACCOUNT_SUSPENDED**: Sent when a user account is suspended

These templates can be customized in Settings > Communication Templates.

### Template Variables

User-related email templates support the following variables:

- `{user_name}` - User's full name
- `{user_email}` - User's email address
- `{password}` - Temporary password (for new account/reset)
- `{login_url}` - URL to login page
- `{shop_name}` - Shop name
- `{shop_phone}` - Shop phone number
- `{shop_email}` - Shop email address
- `{shop_address}` - Shop address

---

## 🌐 API Endpoints

### Authentication
```
POST /api/auth/login        - Login
POST /api/auth/register     - Register (admin only in production)
POST /api/auth/refresh      - Refresh token
GET  /api/auth/me           - Current user
```

### User Management (Admin Only)
```
GET    /api/users                    - List all users
GET    /api/users/:id                - Get user by ID
POST   /api/users                    - Create new user (sends email with password)
PUT    /api/users/:id/suspend       - Suspend user (sends email notification)
PUT    /api/users/:id/activate      - Activate user
POST   /api/users/:id/reset-password - Reset user password (sends email with new password)
GET    /api/users/:id/can-delete    - Check if user can be deleted
```

### Profile Management (Authenticated Users)
```
PUT    /api/users/profile            - Update own profile (name and/or password)
```

**Note:** When creating a new user, a random password is generated and sent via email. The admin does not see the password. When resetting a password, a new random password is generated and sent via email.

---

*See also: [Job](./job.md) | [Settings](./settings.md)*

