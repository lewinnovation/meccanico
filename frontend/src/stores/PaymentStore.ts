import { makeAutoObservable, runInAction } from 'mobx';
import type { RootStore } from './RootStore';
import { api } from '../utils/api';

export interface Payment {
  id: string;
  invoiceId: string;
  paymentMethodId: string;
  amount: number;
  paymentDate: string;
  paymentNote: string | null;
  createdAt: string;
  updatedAt: string;
  paymentMethod?: {
    id: string;
    name: string;
  };
}

export interface CreatePaymentDto {
  paymentMethodId: string;
  amount: number;
  paymentDate?: string;
  paymentNote?: string;
}

export class PaymentStore {
  rootStore: RootStore;
  payments: Payment[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  async fetchByInvoiceId(invoiceId: string): Promise<Payment[]> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.get(`/api/invoices/${invoiceId}/payments`);

      runInAction(() => {
        this.payments = response.data;
        this.isLoading = false;
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch payments';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async create(invoiceId: string, data: CreatePaymentDto): Promise<Payment> {
    if (this.rootStore.authStore.isViewer) {
      throw new Error('You do not have permission to create payments');
    }
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.post(`/api/invoices/${invoiceId}/payments`, data);

      runInAction(() => {
        this.payments.push(response.data);
        this.isLoading = false;
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create payment';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async delete(invoiceId: string, paymentId: string): Promise<void> {
    if (this.rootStore.authStore.isViewer) {
      throw new Error('You do not have permission to delete payments');
    }
    this.isLoading = true;
    this.error = null;

    try {
      await api.delete(`/api/invoices/${invoiceId}/payments/${paymentId}`);

      runInAction(() => {
        this.payments = this.payments.filter((p) => p.id !== paymentId);
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to delete payment';
        this.isLoading = false;
      });
      throw error;
    }
  }

  clearPayments(): void {
    this.payments = [];
  }

  clearError(): void {
    this.error = null;
  }
}
