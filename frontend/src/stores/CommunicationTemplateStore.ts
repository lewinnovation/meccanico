import { makeAutoObservable, runInAction } from 'mobx';
import type { RootStore } from './RootStore';
import { api } from '../utils/api';

export enum CommunicationTemplateType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum CommunicationTemplateAction {
  EMAIL_ESTIMATE = 'EMAIL_ESTIMATE',
  EMAIL_INVOICE = 'EMAIL_INVOICE',
  VEHICLE_READY = 'VEHICLE_READY',
  VEHICLE_IN_PROGRESS = 'VEHICLE_IN_PROGRESS',
  VEHICLE_PENDING = 'VEHICLE_PENDING',
  INVOICE_CREATED = 'INVOICE_CREATED',
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: CommunicationTemplateType;
  action: CommunicationTemplateAction;
  subject: string | null;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  key: string;
  description: string;
}

export interface CreateCommunicationTemplateDto {
  name: string;
  type: CommunicationTemplateType;
  action: CommunicationTemplateAction;
  subject?: string | null;
  body: string;
  isActive?: boolean;
}

export interface UpdateCommunicationTemplateDto {
  name?: string;
  subject?: string | null;
  body?: string;
  isActive?: boolean;
}

export class CommunicationTemplateStore {
  rootStore: RootStore;
  templates: CommunicationTemplate[] = [];
  variables: TemplateVariable[] = [];
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  async fetchTemplates(type?: CommunicationTemplateType): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const params = type ? { type } : {};
      const response = await api.get('/api/communication-templates', { params });
      runInAction(() => {
        this.templates = response.data;
        this.isLoading = false;
      });
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to fetch templates';
        this.isLoading = false;
      });
    }
  }

  async fetchVariables(): Promise<void> {
    try {
      const response = await api.get('/api/communication-templates/variables');
      runInAction(() => {
        this.variables = response.data || [];
      });
    } catch (err) {
      console.error('Failed to fetch template variables:', err);
      runInAction(() => {
        this.variables = [];
      });
    }
  }

  async getTemplateById(id: string): Promise<CommunicationTemplate | null> {
    try {
      const response = await api.get(`/api/communication-templates/${id}`);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch template:', err);
      return null;
    }
  }

  getTemplateByAction(
    action: CommunicationTemplateAction,
    type: CommunicationTemplateType
  ): CommunicationTemplate | null {
    return (
      this.templates.find((t) => t.action === action && t.type === type && t.isActive) || null
    );
  }

  async createTemplate(data: CreateCommunicationTemplateDto): Promise<boolean> {
    this.isSaving = true;
    this.error = null;
    this.successMessage = null;

    try {
      const response = await api.post('/api/communication-templates', data);
      runInAction(() => {
        this.templates.push(response.data);
        this.isSaving = false;
        this.successMessage = 'Template created successfully';
      });
      return true;
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to create template';
        this.isSaving = false;
      });
      return false;
    }
  }

  async updateTemplate(id: string, data: UpdateCommunicationTemplateDto): Promise<boolean> {
    this.isSaving = true;
    this.error = null;
    this.successMessage = null;

    try {
      const response = await api.put(`/api/communication-templates/${id}`, data);
      runInAction(() => {
        const index = this.templates.findIndex((t) => t.id === id);
        if (index !== -1) {
          this.templates[index] = response.data;
        }
        this.isSaving = false;
        this.successMessage = 'Template updated successfully';
      });
      return true;
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to update template';
        this.isSaving = false;
      });
      return false;
    }
  }

  async deleteTemplate(id: string): Promise<boolean> {
    this.isSaving = true;
    this.error = null;
    this.successMessage = null;

    try {
      await api.delete(`/api/communication-templates/${id}`);
      runInAction(() => {
        this.templates = this.templates.filter((t) => t.id !== id);
        this.isSaving = false;
        this.successMessage = 'Template deleted successfully';
      });
      return true;
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to delete template';
        this.isSaving = false;
      });
      return false;
    }
  }

  clearMessages(): void {
    this.error = null;
    this.successMessage = null;
  }
}
