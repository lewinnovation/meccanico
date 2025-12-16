import { makeAutoObservable, runInAction } from 'mobx';
import type { RootStore } from './RootStore';
import { api } from '../utils/api';

export type JobStatus =
  | 'ESTIMATE'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'INVOICED'
  | 'PAID'
  | 'CANCELLED'
  | 'DECLINED'
  | 'DISPUTED';

export interface LineItem {
  id: string;
  type: 'INVENTORY' | 'LABOUR' | 'SERVICE' | 'TEXT';
  referenceId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
}

export interface Job {
  id: string;
  code: string;
  customerId: string;
  vehicleId: string;
  assignedTo: string | null;
  status: JobStatus;
  notes: string | null;
  taxRate: number;
  discountAmount: number;
  discountPercent: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; code: string; name: string };
  vehicle?: { id: string; code: string; make: string; model: string; year: number };
  lineItems?: LineItem[];
}

export class JobStore {
  rootStore: RootStore;
  jobs: Job[] = [];
  selectedJob: Job | null = null;
  isLoading = false;
  total = 0;
  page = 1;
  statusFilter: JobStatus | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  get filteredJobs(): Job[] {
    if (!this.statusFilter) return this.jobs;
    return this.jobs.filter((j) => j.status === this.statusFilter);
  }

  setStatusFilter(status: JobStatus | null): void {
    this.statusFilter = status;
  }

  async fetchJobs(params?: { status?: JobStatus; search?: string; page?: number }): Promise<void> {
    this.isLoading = true;
    
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set('status', params.status);
      if (params?.search) queryParams.set('search', params.search);
      queryParams.set('page', (params?.page || 1).toString());
      
      const response = await api.get(`/api/jobs?${queryParams}`);
      
      runInAction(() => {
        this.jobs = response.data.data;
        this.total = response.data.total;
        this.page = response.data.page;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchJobById(id: string): Promise<Job> {
    this.isLoading = true;
    
    try {
      const response = await api.get(`/api/jobs/${id}`);
      
      runInAction(() => {
        this.selectedJob = response.data;
        this.isLoading = false;
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
      });
      throw error;
    }
  }

  async createJob(data: { customerId: string; vehicleId: string; notes?: string }): Promise<Job> {
    const response = await api.post('/api/jobs', data);
    
    runInAction(() => {
      this.jobs.unshift(response.data);
    });

    return response.data;
  }

  async updateJobStatus(id: string, status: JobStatus): Promise<Job> {
    const response = await api.post(`/api/jobs/${id}/status`, { status });
    
    runInAction(() => {
      const index = this.jobs.findIndex((j) => j.id === id);
      if (index !== -1) {
        this.jobs[index] = response.data;
      }
      if (this.selectedJob?.id === id) {
        this.selectedJob = response.data;
      }
    });

    return response.data;
  }

  async addLineItem(jobId: string, item: Partial<LineItem>): Promise<LineItem> {
    const response = await api.post(`/api/jobs/${jobId}/line-items`, item);
    
    runInAction(() => {
      if (this.selectedJob?.id === jobId && this.selectedJob.lineItems) {
        this.selectedJob.lineItems.push(response.data);
      }
    });

    return response.data;
  }
}

