import { makeAutoObservable, runInAction } from 'mobx';
import type { RootStore } from './RootStore';
import { api } from '../utils/api';

export interface PaymentMethod {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentMethodDto {
  name: string;
}

export interface UpdatePaymentMethodDto {
  name?: string;
  isActive?: boolean;
}

export class PaymentMethodStore {
  rootStore: RootStore;
  paymentMethods: PaymentMethod[] = [];
  allPaymentMethods: PaymentMethod[] = []; // Including inactive (for admin)
  isLoading = false;
  error: string | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  async fetchAll(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.get('/api/payment-methods');

      runInAction(() => {
        this.paymentMethods = response.data;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch payment methods';
        this.isLoading = false;
      });
    }
  }

  async fetchAllIncludingInactive(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.get('/api/payment-methods/all');

      runInAction(() => {
        this.allPaymentMethods = response.data;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch payment methods';
        this.isLoading = false;
      });
    }
  }

  async create(data: CreatePaymentMethodDto): Promise<PaymentMethod> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.post('/api/payment-methods', data);

      runInAction(() => {
        this.allPaymentMethods.push(response.data);
        this.paymentMethods.push(response.data);
        this.isLoading = false;
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create payment method';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async update(id: string, data: UpdatePaymentMethodDto): Promise<PaymentMethod> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.put(`/api/payment-methods/${id}`, data);

      runInAction(() => {
        const index = this.allPaymentMethods.findIndex((pm) => pm.id === id);
        if (index >= 0) {
          this.allPaymentMethods[index] = response.data;
        }
        const activeIndex = this.paymentMethods.findIndex((pm) => pm.id === id);
        if (activeIndex >= 0) {
          if (response.data.isActive) {
            this.paymentMethods[activeIndex] = response.data;
          } else {
            this.paymentMethods.splice(activeIndex, 1);
          }
        } else if (response.data.isActive) {
          this.paymentMethods.push(response.data);
        }
        this.isLoading = false;
      });

      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to update payment method';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      await api.delete(`/api/payment-methods/${id}`);

      runInAction(() => {
        this.allPaymentMethods = this.allPaymentMethods.filter((pm) => pm.id !== id);
        this.paymentMethods = this.paymentMethods.filter((pm) => pm.id !== id);
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to delete payment method';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchUsageCounts(): Promise<Record<string, number>> {
    try {
      const response = await api.get('/api/payment-methods/usage-counts');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  clearError(): void {
    this.error = null;
  }
}
