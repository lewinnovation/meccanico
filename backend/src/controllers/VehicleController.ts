import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Path,
  Query,
  Route,
  Tags,
  Security,
  SuccessResponse,
} from 'tsoa';
import {
  VehicleService,
  CreateVehicleDto,
  UpdateVehicleDto,
} from '../services/VehicleService';
import { Vehicle } from '../models/Vehicle';
import { PaginatedResult } from '../types/common';

@Route('api/vehicles')
@Tags('Vehicles')
@Security('jwt')
export class VehicleController extends Controller {
  private vehicleService = new VehicleService();

  /**
   * Get all vehicles with pagination and search
   */
  @Get('/')
  public async getVehicles(
    @Query() page: number = 1,
    @Query() limit: number = 50,
    @Query() search?: string,
    @Query() customerId?: string
  ): Promise<PaginatedResult<Vehicle>> {
    return this.vehicleService.findAll(page, limit, search, customerId);
  }

  /**
   * Get a vehicle by ID
   */
  @Get('/{id}')
  public async getVehicle(@Path() id: string): Promise<Vehicle> {
    return this.vehicleService.findById(id);
  }

  /**
   * Get a vehicle by code (e.g., V001)
   */
  @Get('/code/{code}')
  public async getVehicleByCode(@Path() code: string): Promise<Vehicle> {
    return this.vehicleService.findByCode(code);
  }

  /**
   * Get vehicles for a customer
   */
  @Get('/customer/{customerId}')
  public async getVehiclesByCustomer(
    @Path() customerId: string
  ): Promise<Vehicle[]> {
    return this.vehicleService.findByCustomerId(customerId);
  }

  /**
   * Find a vehicle by license plate
   */
  @Get('/search/license-plate/:plate')
  public async getVehicleByLicensePlate(
    @Path() plate: string
  ): Promise<Vehicle> {
    return this.vehicleService.findByLicensePlate(plate);
  }

  /**
   * Find a vehicle by VIN
   */
  @Get('/search/vin/:vin')
  public async getVehicleByVin(
    @Path() vin: string
  ): Promise<Vehicle> {
    return this.vehicleService.findByVin(vin);
  }

  /**
   * Create a new vehicle
   */
  @Post('/')
  @SuccessResponse(201, 'Created')
  public async createVehicle(@Body() body: CreateVehicleDto): Promise<Vehicle> {
    this.setStatus(201);
    return this.vehicleService.create(body);
  }

  /**
   * Update a vehicle
   */
  @Patch('/{id}')
  public async updateVehicle(
    @Path() id: string,
    @Body() body: UpdateVehicleDto
  ): Promise<Vehicle> {
    return this.vehicleService.update(id, body);
  }

  /**
   * Update vehicle mileage
   */
  @Patch('/{id}/mileage')
  public async updateMileage(
    @Path() id: string,
    @Body() body: { mileage: number }
  ): Promise<Vehicle> {
    return this.vehicleService.updateMileage(id, body.mileage);
  }

  /**
   * Add an owner to a vehicle
   */
  @Post('/{id}/owners')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async addOwner(
    @Path() id: string,
    @Body() body: { customerId: string; isPrimary?: boolean }
  ): Promise<Vehicle> {
    return this.vehicleService.addOwner(id, body.customerId, body.isPrimary || false);
  }

  /**
   * Remove an owner from a vehicle
   */
  @Delete('/{id}/owners/{customerId}')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  @SuccessResponse(204, 'Deleted')
  public async removeOwner(
    @Path() id: string,
    @Path() customerId: string
  ): Promise<Vehicle> {
    this.setStatus(204);
    return this.vehicleService.removeOwner(id, customerId);
  }

  /**
   * Set a primary owner for a vehicle
   */
  @Patch('/{id}/owners/{customerId}/primary')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async setPrimaryOwner(
    @Path() id: string,
    @Path() customerId: string
  ): Promise<Vehicle> {
    return this.vehicleService.setPrimaryOwner(id, customerId);
  }

  /**
   * Delete a vehicle
   */
  @Delete('/{id}')
  @SuccessResponse(204, 'Deleted')
  public async deleteVehicle(@Path() id: string): Promise<void> {
    this.setStatus(204);
    return this.vehicleService.delete(id);
  }
}

