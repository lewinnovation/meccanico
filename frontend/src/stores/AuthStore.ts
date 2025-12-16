import { makeAutoObservable, runInAction } from 'mobx';
import type { RootStore } from './RootStore';
import { api } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MECHANIC' | 'VIEWER';
}

export class AuthStore {
  rootStore: RootStore;
  user: User | null = null;
  accessToken: string | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  get isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user;
  }

  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN';
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.accessToken = token;
      this.user = JSON.parse(user);
    }
  }

  private saveToStorage(): void {
    if (this.accessToken && this.user) {
      localStorage.setItem('accessToken', this.accessToken);
      localStorage.setItem('user', JSON.stringify(this.user));
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      runInAction(() => {
        this.user = response.data.user;
        this.accessToken = response.data.accessToken;
        this.isLoading = false;
      });

      this.saveToStorage();
      return true;
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Login failed';
        this.isLoading = false;
      });
      return false;
    }
  }

  logout(): void {
    this.user = null;
    this.accessToken = null;
    this.saveToStorage();
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await api.post('/api/auth/refresh');
      
      runInAction(() => {
        this.accessToken = response.data.accessToken;
      });

      this.saveToStorage();
      return true;
    } catch {
      this.logout();
      return false;
    }
  }
}

