import { makeAutoObservable, runInAction } from 'mobx';
import type { RootStore } from './RootStore';
import { api } from '../utils/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MECHANIC' | 'VIEWER';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  version?: number;
}

export interface CreateUserDto {
  email: string;
  name: string;
  role: 'ADMIN' | 'MECHANIC' | 'VIEWER';
}

export class UserStore {
  rootStore: RootStore;
  users: User[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  async fetchUsers(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.get('/api/users');
      runInAction(() => {
        this.users = response.data;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Failed to fetch users';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async createUser(data: CreateUserDto): Promise<User> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.post('/api/users', data);
      runInAction(() => {
        this.users.unshift(response.data);
        this.isLoading = false;
      });
      return response.data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Failed to create user';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async suspendUser(id: string): Promise<User> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.put(`/api/users/${id}/suspend`);
      runInAction(() => {
        const index = this.users.findIndex((u) => u.id === id);
        if (index !== -1) {
          this.users[index] = response.data;
        }
        this.isLoading = false;
      });
      return response.data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Failed to suspend user';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async activateUser(id: string): Promise<User> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.put(`/api/users/${id}/activate`);
      runInAction(() => {
        const index = this.users.findIndex((u) => u.id === id);
        if (index !== -1) {
          this.users[index] = response.data;
        }
        this.isLoading = false;
      });
      return response.data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Failed to activate user';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async resetPassword(id: string): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      await api.post(`/api/users/${id}/reset-password`);
      runInAction(() => {
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Failed to reset password';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async canDeleteUser(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const response = await api.get(`/api/users/${id}/can-delete`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}
