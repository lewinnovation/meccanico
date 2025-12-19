import { AppDataSource } from '../config/database';
import { AuditLog, AuditAction } from '../models/AuditLog';

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  userId: string | null,
  action: AuditAction,
  entityType: string,
  entityId: string,
  oldValue: unknown | null = null,
  newValue: unknown | null = null
): Promise<void> {
  const auditLogRepository = AppDataSource.getRepository(AuditLog);
  
  const auditLog = auditLogRepository.create({
    userId,
    action,
    entityType,
    entityId,
    oldValue,
    newValue,
  });

  await auditLogRepository.save(auditLog);
}

