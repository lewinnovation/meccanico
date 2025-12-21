import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';
import { api } from '../utils/api';

export interface Labour {
  id: string;
  code: string;
  name: string;
  description: string | null;
  hourlyRate: number;
  defaultHours: number;
  isFlatRate: boolean;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version?: number;
}

export interface CreateLabourDto {
  name: string;
  description?: string;
  hourlyRate: number;
  defaultHours?: number;
  isFlatRate?: boolean;
  category?: string;
}

export interface UpdateLabourDto {
  name?: string;
  description?: string;
  hourlyRate?: number;
  defaultHours?: number;
  isFlatRate?: boolean;
  category?: string;
  isActive?: boolean;
}

export class LabourStore {
  rootStore: RootStore;
  items: Labour[] = [];
  categories: string[] = [];
  selectedItem: Labour | null = null;
  total = 0;
  page = 1;
  limit = 50;
  search = '';
  categoryFilter = '';
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

      const response = await api.get(`/api/labour?${params}`);
      runInAction(() => {
        this.items = response.data.data;
        this.total = response.data.total;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch labour';
        this.isLoading = false;
      });
    }
  }

  async fetchCategories(): Promise<void> {
    try {
      const response = await api.get('/api/labour/categories');
      runInAction(() => {
        this.categories = response.data;
      });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }

  async fetchById(id: string): Promise<Labour | null> {
    this.isLoading = true;
    try {
      const response = await api.get(`/api/labour/${id}`);
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

  async create(data: CreateLabourDto): Promise<Labour | null> {
    if (!this.rootStore.authStore.isAdmin) {
      throw new Error('You do not have permission to create labour items');
    }
    this.isLoading = true;
    this.error = null;
    try {
      const response = await api.post('/api/labour', data);
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

  async update(id: string, data: UpdateLabourDto): Promise<Labour | null> {
    if (!this.rootStore.authStore.isAdmin) {
      throw new Error('You do not have permission to update labour items');
    }
    this.isLoading = true;
    this.error = null;
    try {
      // Include current version from selectedItem if available
      const updateData = {
        ...data,
        version: this.selectedItem?.version,
      };

      const response = await api.patch(`/api/labour/${id}`, updateData);
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
    } catch (error: any) {
      // Handle version conflict (409)
      if (error.response?.status === 409 && error.response?.data?.message?.includes('modified by another user')) {
        // Refresh the item data
        await this.fetchById(id);
        runInAction(() => {
          this.error = 'This labour item was modified by another user. The page has been refreshed with the latest data.';
          this.isLoading = false;
        });
        throw new Error('This labour item was modified by another user. The page has been refreshed with the latest data.');
      }
      
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to update item';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    if (!this.rootStore.authStore.isAdmin) {
      throw new Error('You do not have permission to delete labour items');
    }
    this.isLoading = true;
    this.error = null;
    try {
      await api.delete(`/api/labour/${id}`);
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

  setSearch(search: string): void {
    this.search = search;
    this.page = 1;
  }

  setCategoryFilter(category: string): void {
    this.categoryFilter = category;
    this.page = 1;
  }

  setPage(page: number): void {
    this.page = page;
  }
}

