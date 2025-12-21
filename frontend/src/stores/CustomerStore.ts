import { makeAutoObservable, runInAction } from 'mobx';
import type { RootStore } from './RootStore';
import { api } from '../utils/api';

export interface Customer {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  version?: number;
}

export class CustomerStore {
  rootStore: RootStore;
  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  isLoading = false;
  total = 0;
  page = 1;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  async fetchCustomers(search?: string, page = 1): Promise<void> {
    this.isLoading = true;
    
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (search) params.set('search', search);
      
      const response = await api.get(`/api/customers?${params}`);
      
      runInAction(() => {
        this.customers = response.data.data;
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

  async fetchCustomerById(id: string): Promise<Customer> {
    this.isLoading = true;
    
    try {
      const response = await api.get(`/api/customers/${id}`);
      
      runInAction(() => {
        this.selectedCustomer = response.data;
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

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const response = await api.post('/api/customers', data);
    
    runInAction(() => {
      this.customers.unshift(response.data);
    });

    return response.data;
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    try {
      // Include current version from selectedCustomer if available
      const updateData = {
        ...data,
        version: this.selectedCustomer?.version,
      };

      const response = await api.patch(`/api/customers/${id}`, updateData);
      
      runInAction(() => {
        const index = this.customers.findIndex((c) => c.id === id);
        if (index !== -1) {
          this.customers[index] = response.data;
        }
        if (this.selectedCustomer?.id === id) {
          this.selectedCustomer = response.data;
        }
      });

      return response.data;
    } catch (error: any) {
      // Handle version conflict (409)
      if (error.response?.status === 409 && error.response?.data?.message?.includes('modified by another user')) {
        // Refresh the customer data
        await this.fetchCustomerById(id);
        throw new Error('This customer was modified by another user. The page has been refreshed with the latest data.');
      }
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    await api.delete(`/api/customers/${id}`);
    
    runInAction(() => {
      this.customers = this.customers.filter((c) => c.id !== id);
      if (this.selectedCustomer?.id === id) {
        this.selectedCustomer = null;
      }
    });
  }
}

