import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';
import { api } from '../utils/api';

export interface Inventory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sku: string | null;
  unitPrice: number;
  costPrice: number | null;
  quantityInStock: number;
  minimumStock: number;
  category: string | null;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryDto {
  name: string;
  description?: string;
  sku?: string;
  unitPrice: number;
  costPrice?: number;
  quantityInStock?: number;
  minimumStock?: number;
  category?: string;
  unit?: string;
}

export interface UpdateInventoryDto {
  name?: string;
  description?: string;
  sku?: string;
  unitPrice?: number;
  costPrice?: number;
  minimumStock?: number;
  category?: string;
  unit?: string;
  isActive?: boolean;
}

export class InventoryStore {
  rootStore: RootStore;
  items: Inventory[] = [];
  categories: string[] = [];
  selectedItem: Inventory | null = null;
  total = 0;
  page = 1;
  limit = 50;
  search = '';
  categoryFilter = '';
  lowStockOnly = false;
  isLoading = false;
  error: string | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  async fetchItems(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      const params = new URLSearchParams({
        page: this.page.toString(),
        limit: this.limit.toString(),
      });
      if (this.search) params.append('search', this.search);
      if (this.categoryFilter) params.append('category', this.categoryFilter);
      if (this.lowStockOnly) params.append('lowStock', 'true');

      const response = await api.get(`/api/inventory?${params}`);
      runInAction(() => {
        this.items = response.data.data;
        this.total = response.data.total;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch inventory';
        this.isLoading = false;
      });
    }
  }

  async fetchCategories(): Promise<void> {
    try {
      const response = await api.get('/api/inventory/categories');
      runInAction(() => {
        this.categories = response.data;
      });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }

  async fetchById(id: string): Promise<Inventory | null> {
    this.isLoading = true;
    try {
      const response = await api.get(`/api/inventory/${id}`);
      runInAction(() => {
        this.selectedItem = response.data;
        this.isLoading = false;
      });
      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch item';
        this.isLoading = false;
      });
      return null;
    }
  }

  async create(data: CreateInventoryDto): Promise<Inventory | null> {
    this.isLoading = true;
    this.error = null;
    try {
      const response = await api.post('/api/inventory', data);
      runInAction(() => {
        this.items.unshift(response.data);
        this.total += 1;
        this.isLoading = false;
      });
      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create item';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async update(id: string, data: UpdateInventoryDto): Promise<Inventory | null> {
    this.isLoading = true;
    this.error = null;
    try {
      const response = await api.patch(`/api/inventory/${id}`, data);
      runInAction(() => {
        const index = this.items.findIndex((i) => i.id === id);
        if (index >= 0) {
          this.items[index] = response.data;
        }
        if (this.selectedItem?.id === id) {
          this.selectedItem = response.data;
        }
        this.isLoading = false;
      });
      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to update item';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      await api.delete(`/api/inventory/${id}`);
      runInAction(() => {
        this.items = this.items.filter((i) => i.id !== id);
        this.total -= 1;
        if (this.selectedItem?.id === id) {
          this.selectedItem = null;
        }
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to delete item';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async adjustStock(id: string, adjustment: number, reason?: string): Promise<void> {
    try {
      const response = await api.post(`/api/inventory/${id}/adjust-stock`, { adjustment, reason });
      runInAction(() => {
        const index = this.items.findIndex((i) => i.id === id);
        if (index >= 0) {
          this.items[index] = response.data;
        }
        if (this.selectedItem?.id === id) {
          this.selectedItem = response.data;
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to adjust stock';
      });
      throw error;
    }
  }

  setSearch(search: string): void {
    this.search = search;
    this.page = 1;
  }

  setCategoryFilter(category: string): void {
    this.categoryFilter = category;
    this.page = 1;
  }

  setLowStockOnly(lowStock: boolean): void {
    this.lowStockOnly = lowStock;
    this.page = 1;
  }

  setPage(page: number): void {
    this.page = page;
  }
}

