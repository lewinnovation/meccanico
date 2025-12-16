import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';
import { api } from '../utils/api';

export type LineItemType = 'INVENTORY' | 'LABOUR' | 'SERVICE' | 'TEXT';

export interface TemplateItem {
  id: string;
  templateId: string;
  itemType: LineItemType;
  itemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
}

export interface Template {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isGlobal: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  items: TemplateItem[];
}

export interface CreateTemplateItemDto {
  itemType: LineItemType;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder?: number;
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  isGlobal?: boolean;
  items?: CreateTemplateItemDto[];
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  isGlobal?: boolean;
  items?: CreateTemplateItemDto[];
}

export class TemplateStore {
  rootStore: RootStore;
  items: Template[] = [];
  selectedItem: Template | null = null;
  total = 0;
  page = 1;
  limit = 50;
  search = '';
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

      const response = await api.get(`/api/templates?${params}`);
      runInAction(() => {
        this.items = response.data.data;
        this.total = response.data.total;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch templates';
        this.isLoading = false;
      });
    }
  }

  async fetchById(id: string): Promise<Template | null> {
    this.isLoading = true;
    try {
      const response = await api.get(`/api/templates/${id}`);
      runInAction(() => {
        this.selectedItem = response.data;
        this.isLoading = false;
      });
      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch template';
        this.isLoading = false;
      });
      return null;
    }
  }

  async create(data: CreateTemplateDto): Promise<Template | null> {
    this.isLoading = true;
    this.error = null;
    try {
      const response = await api.post('/api/templates', data);
      runInAction(() => {
        this.items.unshift(response.data);
        this.total += 1;
        this.isLoading = false;
      });
      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create template';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async update(id: string, data: UpdateTemplateDto): Promise<Template | null> {
    this.isLoading = true;
    this.error = null;
    try {
      const response = await api.patch(`/api/templates/${id}`, data);
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
        this.error = error instanceof Error ? error.message : 'Failed to update template';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      await api.delete(`/api/templates/${id}`);
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
        this.error = error instanceof Error ? error.message : 'Failed to delete template';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async addItem(templateId: string, item: CreateTemplateItemDto): Promise<TemplateItem | null> {
    try {
      const response = await api.post(`/api/templates/${templateId}/items`, item);
      runInAction(() => {
        const template = this.items.find((t) => t.id === templateId);
        if (template) {
          template.items.push(response.data);
        }
        if (this.selectedItem?.id === templateId) {
          this.selectedItem.items.push(response.data);
        }
      });
      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to add item';
      });
      throw error;
    }
  }

  async removeItem(templateId: string, itemId: string): Promise<void> {
    try {
      await api.delete(`/api/templates/${templateId}/items/${itemId}`);
      runInAction(() => {
        const template = this.items.find((t) => t.id === templateId);
        if (template) {
          template.items = template.items.filter((i) => i.id !== itemId);
        }
        if (this.selectedItem?.id === templateId) {
          this.selectedItem.items = this.selectedItem.items.filter((i) => i.id !== itemId);
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to remove item';
      });
      throw error;
    }
  }

  setSearch(search: string): void {
    this.search = search;
    this.page = 1;
  }

  setPage(page: number): void {
    this.page = page;
  }
}

