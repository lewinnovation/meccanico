# Optimistic Locking

> Version-based concurrency control to prevent concurrent edit conflicts.

---

## Overview

The Meccanico platform implements optimistic locking across all entities that support updates. This prevents data corruption when multiple users edit the same record simultaneously.

---

## How It Works

### Version Column

All entities that support updates include a `version` column:

```sql
version INTEGER NOT NULL DEFAULT 0
```

- **Type**: Integer
- **Default**: 0
- **Auto-increment**: Automatically incremented by TypeORM on each successful update
- **Purpose**: Tracks the number of times a record has been modified

### Update Flow

1. **Load Record**: User loads a record (e.g., Job) which includes the current `version` number
2. **Edit**: User makes changes in the UI
3. **Save**: Frontend sends update request with the `version` number from step 1
4. **Backend Check**: Backend verifies the `version` matches the database version
5. **Success**: If versions match, update succeeds and version increments
6. **Conflict**: If versions don't match, update is rejected with a 409 error

---

## Entities with Version Support

The following entities support optimistic locking:

- ✅ **Job** - Work orders
- ✅ **Customer** - Client records
- ✅ **Vehicle** - Vehicle records
- ✅ **Invoice** - Payment tracking
- ✅ **LineItem** - Items within jobs
- ✅ **Inventory** - Parts catalog
- ✅ **Service** - Service packages
- ✅ **Labour** - Labor rates
- ✅ **Template** - Job templates
- ✅ **PaymentMethod** - Payment methods
- ✅ **CommunicationTemplate** - Email/SMS templates

---

## API Behavior

### Update Request

When updating an entity, include the `version` field:

```http
PATCH /api/jobs/:id
Content-Type: application/json

{
  "notes": "Updated notes",
  "taxRate": 10.0,
  "version": 5
}
```

### Success Response (200 OK)

```json
{
  "id": "uuid",
  "code": "J001",
  "notes": "Updated notes",
  "taxRate": 10.0,
  "version": 6,
  ...
}
```

The version increments from 5 to 6.

### Conflict Response (409 Conflict)

```json
{
  "statusCode": 409,
  "message": "This job has been modified by another user. Please refresh and try again.",
  "error": "VersionConflictError"
}
```

---

## Frontend Handling

### Automatic Refresh

When a version conflict occurs:

1. **Error Detection**: Frontend catches 409 status code
2. **Data Refresh**: Automatically fetches latest data from server
3. **User Notification**: Shows user-friendly error message
4. **Dialog Behavior**: Keeps edit dialog open so user can review changes
5. **Retry**: User can review changes and save again

### Example Error Message

> "This job was modified by another user. The page has been refreshed with the latest data. Please review and save again."

---

## Database Migration

For existing databases, run the migration script:

```bash
npm run db:add-versions
```

This adds `version` columns to all tables (idempotent - safe to run multiple times).

For new databases, TypeORM's `synchronize` will automatically create the columns.

---

## TypeORM Integration

### Entity Definition

```typescript
import { Version } from 'typeorm';

@Entity('jobs')
export class Job {
  // ... other fields ...

  @Column({ type: 'int', default: 0 })
  @Version()
  version: number;
}
```

### Service Update Method

```typescript
async update(id: string, data: UpdateJobDto): Promise<Job> {
  const job = await this.repository.findOne({ where: { id } });
  
  // Check version if provided
  if (data.version !== undefined && data.version !== job.version) {
    throw new VersionConflictError(
      'This job has been modified by another user. Please refresh and try again.'
    );
  }
  
  // ... update logic ...
  
  try {
    return await this.repository.save(job);
  } catch (error) {
    if (error instanceof OptimisticLockVersionMismatchError) {
      throw new VersionConflictError(
        'This job has been modified by another user. Please refresh and try again.'
      );
    }
    throw error;
  }
}
```

---

## Benefits

1. **Prevents Data Loss**: Concurrent edits don't overwrite each other
2. **User-Friendly**: Clear error messages guide users
3. **Automatic Recovery**: Frontend automatically refreshes data
4. **No Locking**: No database-level locks, better performance
5. **Transparent**: Works automatically, no special user actions needed

---

## Testing

To test optimistic locking:

1. Open the same record in two browser windows
2. Make different changes in each window
3. Save changes in window 1 (should succeed)
4. Save changes in window 2 (should show conflict error)
5. Window 2 automatically refreshes with latest data
6. User can review changes and save again

---

## Related Documentation

- [Job Entity](./models/job.md)
- [Customer Entity](./models/customer.md)
- [Vehicle Entity](./models/vehicle.md)
- [Domain Models Overview](./models/README.md)
