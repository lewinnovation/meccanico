import { makeAutoObservable, runInAction } from 'mobx';
import type { RootStore } from './RootStore';
import { api } from '../utils/api';

export interface VehicleMake {
  id: string;
  name: string;
  country: string | null;
  isActive: boolean;
  sortOrder: number;
  models: VehicleModel[];
}

export interface VehicleModel {
  id: string;
  makeId: string;
  name: string;
  category: string | null;
  yearStart: number | null;
  yearEnd: number | null;
  isActive: boolean;
}

export interface VehicleOwner {
  id: string;
  vehicleId: string;
  customerId: string;
  isPrimary: boolean;
  customer?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface Vehicle {
  id: string;
  code: string;
  make: string;
  model: string;
  year: number | null;
  vin: string | null;
  licensePlate: string | null;
  color: string | null;
  mileage: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  version?: number;
  owners?: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  vehicleOwners?: VehicleOwner[];
  // Deprecated: kept for backward compatibility
  customerId?: string;
  customer?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface CreateVehicleDto {
  customerIds: string[];
  make: string;
  model: string;
  year?: number;
  vin?: string;
  licensePlate?: string;
  color?: string;
  mileage?: number;
  notes?: string;
}

export interface UpdateVehicleDto {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  licensePlate?: string;
  color?: string;
  mileage?: number;
  notes?: string;
}

export class VehicleStore {
  rootStore: RootStore;
  vehicles: Vehicle[] = [];
  selectedVehicle: Vehicle | null = null;
  makes: VehicleMake[] = [];
  isLoading = false;
  isMakesLoading = false;
  error: string | null = null;
  total = 0;
  page = 1;
  limit = 50;
  search = '';
  customerFilter = '';

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  setSearch(search: string): void {
    this.search = search;
  }

  setCustomerFilter(customerId: string): void {
    this.customerFilter = customerId;
  }

  setPage(page: number): void {
    this.page = page;
  }

  // ===================== VEHICLES =====================

  async fetchVehicles(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      const params: Record<string, unknown> = {
        page: this.page,
        limit: this.limit,
      };
      if (this.search) params.search = this.search;
      if (this.customerFilter) params.customerId = this.customerFilter;

      const response = await api.get('/api/vehicles', { params });
      runInAction(() => {
        this.vehicles = response.data.data;
        this.total = response.data.total;
        this.page = response.data.page;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch vehicles';
        this.isLoading = false;
      });
    }
  }

  async fetchVehicleById(id: string): Promise<Vehicle> {
    this.isLoading = true;
    this.error = null;
    try {
      const response = await api.get(`/api/vehicles/${id}`);
      runInAction(() => {
        this.selectedVehicle = response.data;
        this.isLoading = false;
      });
      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch vehicle';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchVehiclesByCustomer(customerId: string): Promise<Vehicle[]> {
    try {
      const response = await api.get(`/api/vehicles/customer/${customerId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle> {
    try {
      const response = await api.get(`/api/vehicles/search/license-plate/${encodeURIComponent(licensePlate)}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async findByVin(vin: string): Promise<Vehicle> {
    try {
      const response = await api.get(`/api/vehicles/search/vin/${encodeURIComponent(vin)}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createVehicle(data: CreateVehicleDto): Promise<Vehicle> {
    if (this.rootStore.authStore.isViewer) {
      throw new Error('You do not have permission to create vehicles');
    }
    this.isLoading = true;
    this.error = null;
    try {
      const response = await api.post('/api/vehicles', data);
      runInAction(() => {
        this.vehicles.unshift(response.data);
        this.total++;
        this.isLoading = false;
      });
      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create vehicle';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async updateVehicle(id: string, data: UpdateVehicleDto): Promise<Vehicle> {
    if (this.rootStore.authStore.isViewer) {
      throw new Error('You do not have permission to update vehicles');
    }
    this.isLoading = true;
    this.error = null;
    try {
      // Include current version from selectedVehicle if available
      const updateData = {
        ...data,
        version: this.selectedVehicle?.version,
      };

      const response = await api.patch(`/api/vehicles/${id}`, updateData);
      runInAction(() => {
        const index = this.vehicles.findIndex((v) => v.id === id);
        if (index !== -1) {
          this.vehicles[index] = response.data;
        }
        if (this.selectedVehicle?.id === id) {
          this.selectedVehicle = response.data;
        }
        this.isLoading = false;
      });
      return response.data;
    } catch (error: any) {
      // Handle version conflict (409)
      if (error.response?.status === 409 && error.response?.data?.message?.includes('modified by another user')) {
        // Refresh the vehicle data
        await this.fetchVehicleById(id);
        runInAction(() => {
          this.error = 'This vehicle was modified by another user. The page has been refreshed with the latest data.';
          this.isLoading = false;
        });
        throw new Error('This vehicle was modified by another user. The page has been refreshed with the latest data.');
      }
      
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to update vehicle';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async deleteVehicle(id: string): Promise<void> {
    if (this.rootStore.authStore.isViewer) {
      throw new Error('You do not have permission to delete vehicles');
    }
    this.isLoading = true;
    this.error = null;
    try {
      await api.delete(`/api/vehicles/${id}`);
      runInAction(() => {
        this.vehicles = this.vehicles.filter((v) => v.id !== id);
        this.total--;
        if (this.selectedVehicle?.id === id) {
          this.selectedVehicle = null;
        }
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to delete vehicle';
        this.isLoading = false;
      });
      throw error;
    }
  }

  // ===================== MAKES & MODELS =====================

  async fetchMakes(): Promise<void> {
    this.isMakesLoading = true;
    try {
      const response = await api.get('/api/vehicle-makes');
      runInAction(() => {
        this.makes = response.data;
        this.isMakesLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.isMakesLoading = false;
      });
    }
  }

  getModelsForMake(makeName: string): VehicleModel[] {
    const make = this.makes.find((m) => m.name === makeName);
    return make?.models || [];
  }

  async createMake(name: string, country?: string): Promise<VehicleMake> {
    const response = await api.post('/api/vehicle-makes', { name, country });
    runInAction(() => {
      this.makes.push(response.data);
    });
    return response.data;
  }

  async createModel(makeId: string, name: string, category?: string): Promise<VehicleModel> {
    const response = await api.post('/api/vehicle-makes/models', { makeId, name, category });
    runInAction(() => {
      const make = this.makes.find((m) => m.id === makeId);
      if (make) {
        make.models.push(response.data);
      }
    });
    return response.data;
  }

  // ===================== OWNER MANAGEMENT =====================

  async addOwner(vehicleId: string, customerId: string, isPrimary: boolean = false): Promise<Vehicle> {
    this.isLoading = true;
    this.error = null;
    try {
      const response = await api.post(`/api/vehicles/${vehicleId}/owners`, { customerId, isPrimary });
      runInAction(() => {
        const index = this.vehicles.findIndex((v) => v.id === vehicleId);
        if (index !== -1) {
          this.vehicles[index] = response.data;
        }
        if (this.selectedVehicle?.id === vehicleId) {
          this.selectedVehicle = response.data;
        }
        this.isLoading = false;
      });
      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to add owner';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async removeOwner(vehicleId: string, customerId: string): Promise<Vehicle> {
    this.isLoading = true;
    this.error = null;
    try {
      const response = await api.delete(`/api/vehicles/${vehicleId}/owners/${customerId}`);
      runInAction(() => {
        const index = this.vehicles.findIndex((v) => v.id === vehicleId);
        if (index !== -1) {
          this.vehicles[index] = response.data;
        }
        if (this.selectedVehicle?.id === vehicleId) {
          this.selectedVehicle = response.data;
        }
        this.isLoading = false;
      });
      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to remove owner';
        this.isLoading = false;
      });
      throw error;
    }
  }

  async setPrimaryOwner(vehicleId: string, customerId: string): Promise<Vehicle> {
    this.isLoading = true;
    this.error = null;
    try {
      const response = await api.patch(`/api/vehicles/${vehicleId}/owners/${customerId}/primary`);
      runInAction(() => {
        const index = this.vehicles.findIndex((v) => v.id === vehicleId);
        if (index !== -1) {
          this.vehicles[index] = response.data;
        }
        if (this.selectedVehicle?.id === vehicleId) {
          this.selectedVehicle = response.data;
        }
        this.isLoading = false;
      });
      return response.data;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to set primary owner';
        this.isLoading = false;
      });
      throw error;
    }
  }
}

