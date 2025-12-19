import { AppDataSource } from '../config/database';
import { AuditLog, AuditAction } from '../models/AuditLog';

export class AuditLogService {
  private repository = AppDataSource.getRepository(AuditLog);

  /**
   * Get audit logs for a specific entity
   */
  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.repository.find({
      where: {
        entityType,
        entityId,
      },
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Get audit logs for a job (including line item changes)
   */
  async findByJob(jobId: string): Promise<AuditLog[]> {
    // Get job audit logs
    const jobLogs = await this.repository.find({
      where: {
        entityType: 'Job',
        entityId: jobId,
      },
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
    });

    // Get line item audit logs for this job
    // Note: This query assumes line items have jobId in their old_value/new_value JSON
    // If the structure is different, this may need adjustment
    const lineItemLogs = await this.repository
      .createQueryBuilder('audit_log')
      .where('audit_log.entity_type = :entityType', { entityType: 'LineItem' })
      .andWhere(
        '(audit_log.new_value::text LIKE :jobIdPattern OR audit_log.old_value::text LIKE :jobIdPattern)',
        { jobIdPattern: `%"jobId":"${jobId}"%` }
      )
      .leftJoinAndSelect('audit_log.user', 'user')
      .orderBy('audit_log.created_at', 'DESC')
      .getMany();

    // Combine and sort by date
    const allLogs = [...jobLogs, ...lineItemLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return allLogs;
  }
}

