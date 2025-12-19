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

export type LineItemType = 'INVENTORY' | 'LABOUR' | 'SERVICE' | 'TEXT';

export interface LineItem {
  id: string;
  jobId: string;
  type: LineItemType;
  referenceId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  sortOrder: number;
}

export interface CreateLineItemDto {
  type: LineItemType;
  referenceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  sortOrder?: number;
}

export interface UpdateLineItemDto {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  notes?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface Vehicle {
  id: string;
  code: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string | null;
  vin: string | null;
}

export interface Job {
  id: string;
  code: string;
  customerId: string;
  vehicleId: string | null;
  assignedTo: string | null;
  status: JobStatus;
  notes: string | null;
  internalNotes: string | null;
  taxRate: number;
  discountAmount: number;
  discountPercent: number;
  dueDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  invoicedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  vehicle?: Vehicle;
  assignee?: { id: string; name: string };
  lineItems?: LineItem[];
}

export interface CreateJobDto {
  customerId: string;
  vehicleId?: string;
  assignedTo?: string;
  notes?: string;
  taxRate?: number;
}

export interface UpdateJobDto {
  customerId?: string;
  vehicleId?: string;
  assignedTo?: string;
  notes?: string;
  internalNotes?: string;
  taxRate?: number;
  discountAmount?: number;
  discountPercent?: number;
  dueDate?: string;
}

export class JobStore {
  rootStore: RootStore;
  jobs: Job[] = [];
  selectedJob: Job | null = null;
  isLoading = false;
  error: string | null = null;
  total = 0;
  page = 1;
  limit = 50;
  search = '';
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
    this.page = 1;
  }

  setSearch(search: string): void {
    this.search = search;
    this.page = 1;
  }

  setPage(page: number): void {
    this.page = page;
  }

  async fetchJobs(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const params = new URLSearchParams({
        page: this.page.toString(),
        limit: this.limit.toString(),
      });
      if (this.statusFilter) params.append('status', this.statusFilter);
      if (this.search) params.append('search', this.search);

      const response = await api.get(`/api/jobs?${params}`);

      runInAction(() => {
        this.jobs = response.data.data;
        this.total = response.data.total;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch jobs';
        this.isLoading = false;
      });
    }
  }

  async fetchJobById(id: string): Promise<Job | null> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.get(`/api/jobs/${id}`);

      runInAction(() => {
        this.selectedJob = response.data;
        this.isLoading = false;
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch job';
        this.isLoading = false;
      });
      return null;
    }
  }

  async createJob(data: CreateJobDto): Promise<Job | null> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.post('/api/jobs', data);

      runInAction(() => {
        this.jobs.unshift(response.data);
        this.total += 1;
        this.isLoading = false;
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create job';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async updateJob(id: string, data: UpdateJobDto): Promise<Job | null> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.patch(`/api/jobs/${id}`, data);

      runInAction(() => {
        const index = this.jobs.findIndex((j) => j.id === id);
        if (index >= 0) {
          this.jobs[index] = response.data;
        }
        if (this.selectedJob?.id === id) {
          this.selectedJob = response.data;
        }
        this.isLoading = false;
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to update job';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async updateJobStatus(id: string, status: JobStatus): Promise<Job | null> {
    try {
      const response = await api.post(`/api/jobs/${id}/status`, { status });

      runInAction(() => {
        const index = this.jobs.findIndex((j) => j.id === id);
        if (index >= 0) {
          this.jobs[index] = response.data;
        }
        if (this.selectedJob?.id === id) {
          this.selectedJob = response.data;
        }
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to update job status';
      });
      throw error;
    }
  }

  async deleteJob(id: string): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      await api.delete(`/api/jobs/${id}`);

      runInAction(() => {
        this.jobs = this.jobs.filter((j) => j.id !== id);
        this.total -= 1;
        if (this.selectedJob?.id === id) {
          this.selectedJob = null;
        }
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to delete job';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async duplicateJob(id: string): Promise<Job | null> {
    try {
      const response = await api.post(`/api/jobs/${id}/duplicate`);

      runInAction(() => {
        this.jobs.unshift(response.data);
        this.total += 1;
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to duplicate job';
      });
      throw error;
    }
  }

  async applyTemplate(jobId: string, templateId: string): Promise<Job | null> {
    try {
      const response = await api.post(`/api/jobs/${jobId}/apply-template/${templateId}`);

      runInAction(() => {
        if (this.selectedJob?.id === jobId) {
          this.selectedJob = response.data;
        }
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to apply template';
      });
      throw error;
    }
  }

  // Line Item Methods
  async addLineItem(jobId: string, item: CreateLineItemDto): Promise<LineItem | null> {
    try {
      const response = await api.post(`/api/jobs/${jobId}/line-items`, item);

      runInAction(() => {
        if (this.selectedJob?.id === jobId && this.selectedJob.lineItems) {
          // Create new array to trigger React re-renders
          this.selectedJob.lineItems = [...this.selectedJob.lineItems, response.data];
        }
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to add line item';
      });
      throw error;
    }
  }

  async addLineItemsBulk(jobId: string, items: CreateLineItemDto[]): Promise<LineItem[]> {
    try {
      const response = await api.post(`/api/jobs/${jobId}/line-items/bulk`, { items });

      runInAction(() => {
        if (this.selectedJob?.id === jobId && this.selectedJob.lineItems) {
          // Create new array to trigger React re-renders
          this.selectedJob.lineItems = [...this.selectedJob.lineItems, ...response.data];
        }
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to add line items';
      });
      throw error;
    }
  }

  async updateLineItem(jobId: string, lineItemId: string, data: UpdateLineItemDto): Promise<LineItem | null> {
    try {
      const response = await api.patch(`/api/jobs/${jobId}/line-items/${lineItemId}`, data);

      runInAction(() => {
        if (this.selectedJob?.id === jobId && this.selectedJob.lineItems) {
          // Create new array to trigger React re-renders
          this.selectedJob.lineItems = this.selectedJob.lineItems.map((i) =>
            i.id === lineItemId ? response.data : i
          );
        }
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to update line item';
      });
      throw error;
    }
  }

  async deleteLineItem(jobId: string, lineItemId: string): Promise<void> {
    try {
      await api.delete(`/api/jobs/${jobId}/line-items/${lineItemId}`);

      runInAction(() => {
        if (this.selectedJob?.id === jobId && this.selectedJob.lineItems) {
          this.selectedJob.lineItems = this.selectedJob.lineItems.filter((i) => i.id !== lineItemId);
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to delete line item';
      });
      throw error;
    }
  }

  async reorderLineItems(jobId: string, items: { id: string; sortOrder: number }[]): Promise<void> {
    try {
      const response = await api.post(`/api/jobs/${jobId}/line-items/reorder`, { items });

      runInAction(() => {
        if (this.selectedJob?.id === jobId) {
          this.selectedJob.lineItems = response.data;
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to reorder line items';
      });
      throw error;
    }
  }

  // Computed values for the selected job
  get subtotal(): number {
    if (!this.selectedJob?.lineItems) return 0;
    return this.selectedJob.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  get discountTotal(): number {
    if (!this.selectedJob) return 0;
    if (this.selectedJob.discountPercent > 0) {
      return this.subtotal * (this.selectedJob.discountPercent / 100);
    }
    return this.selectedJob.discountAmount || 0;
  }

  get taxTotal(): number {
    if (!this.selectedJob) return 0;
    const afterDiscount = this.subtotal - this.discountTotal;
    return afterDiscount * (this.selectedJob.taxRate / 100);
  }

  get grandTotal(): number {
    return this.subtotal - this.discountTotal + this.taxTotal;
  }

  clearSelectedJob(): void {
    this.selectedJob = null;
  }
}
