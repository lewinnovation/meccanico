import { makeAutoObservable, runInAction } from 'mobx';
import type { RootStore } from './RootStore';
import { api } from '../utils/api';

export type InvoiceStatus = 'UNPAID' | 'PAID';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  jobId: string;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  paymentNote: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: string;
    code: string;
    customer?: { id: string; name: string; code: string };
    vehicle?: { id: string; make: string; model: string; code: string };
    lineItems?: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
}

export interface CreateInvoiceFromJobDto {
  jobId: string;
}

export interface MarkInvoicePaidDto {
  paymentNote?: string;
}

export class InvoiceStore {
  rootStore: RootStore;
  selectedInvoice: Invoice | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  async createFromJob(jobId: string): Promise<Invoice | null> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.post(`/api/invoices/from-job/${jobId}`);

      runInAction(() => {
        this.selectedInvoice = response.data;
        this.isLoading = false;
        
        // Update job in JobStore if it's the selected job
        const jobStore = this.rootStore.jobStore;
        if (jobStore.selectedJob?.id === jobId) {
          jobStore.selectedJob.invoiceId = response.data.id;
        }
        
        // Update job in jobs list
        const jobIndex = jobStore.jobs.findIndex((j) => j.id === jobId);
        if (jobIndex >= 0) {
          jobStore.jobs[jobIndex].invoiceId = response.data.id;
        }
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create invoice';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async markAsPaid(invoiceId: string, paymentNote?: string): Promise<Invoice | null> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.patch(`/api/invoices/${invoiceId}/pay`, {
        paymentNote,
      });

      runInAction(() => {
        if (this.selectedInvoice?.id === invoiceId) {
          this.selectedInvoice = response.data;
        }
        this.isLoading = false;
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to mark invoice as paid';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchByJobId(jobId: string): Promise<Invoice | null> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.get(`/api/invoices/job/${jobId}`);

      runInAction(() => {
        this.selectedInvoice = response.data;
        this.isLoading = false;
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        // 404 is acceptable - job might not have an invoice yet
        if (error instanceof Error && error.message.includes('404')) {
          this.selectedInvoice = null;
        } else {
          this.error = error instanceof Error ? error.message : 'Failed to fetch invoice';
        }
        this.isLoading = false;
      });
      return null;
    }
  }

  async fetchById(id: string): Promise<Invoice | null> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.get(`/api/invoices/${id}`);

      runInAction(() => {
        this.selectedInvoice = response.data;
        this.isLoading = false;
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch invoice';
        this.isLoading = false;
      });
      throw error;
    }
  }

  clearSelectedInvoice(): void {
    this.selectedInvoice = null;
  }
}

