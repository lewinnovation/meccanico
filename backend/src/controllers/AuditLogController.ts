import {
  Controller,
  Get,
  Path,
  Route,
  Tags,
  Security,
} from 'tsoa';
import { AuditLogService } from '../services/AuditLogService';
import { AuditLog } from '../models/AuditLog';

@Route('api/audit-logs')
@Tags('Audit Logs')
@Security('jwt')
export class AuditLogController extends Controller {
  private auditLogService = new AuditLogService();

  /**
   * Get audit logs for a job
   */
  @Get('/job/{jobId}')
  public async getJobAuditLogs(@Path() jobId: string): Promise<AuditLog[]> {
    return this.auditLogService.findByJob(jobId);
  }

  /**
   * Get audit logs for an entity
   */
  @Get('/entity/{entityType}/{entityId}')
  public async getEntityAuditLogs(
    @Path() entityType: string,
    @Path() entityId: string
  ): Promise<AuditLog[]> {
    return this.auditLogService.findByEntity(entityType, entityId);
  }
}

