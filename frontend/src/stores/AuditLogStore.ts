import { makeAutoObservable, runInAction } from 'mobx';
import type { RootStore } from './RootStore';
import { api } from '../utils/api';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id: string;
  userId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValue: unknown | null;
  newValue: unknown | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export class AuditLogStore {
  rootStore: RootStore;
  auditLogs: AuditLog[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  async fetchByJob(jobId: string): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.get(`/api/audit-logs/job/${jobId}`);
      runInAction(() => {
        this.auditLogs = response.data;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch audit logs';
        this.isLoading = false;
      });
    }
  }

  clearAuditLogs(): void {
    this.auditLogs = [];
  }
}

