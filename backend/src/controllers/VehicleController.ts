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
  Request,
} from 'tsoa';
import {
  VehicleService,
  CreateVehicleDto,
  CreateVehicleBulkDto,
  BulkCreateVehiclesDto,
  UpdateVehicleDto,
} from '../services/VehicleService';
import { Vehicle } from '../models/Vehicle';
import { VehicleOdometerReading } from '../models/VehicleOdometerReading';
import { PaginatedResult } from '../types/common';
import { AuthenticatedRequest } from '../middleware/auth';
import { BadRequestError } from '../middleware/errorHandler';

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
  @Get('/search/license-plate/{plate}')
  public async getVehicleByLicensePlate(
    @Path() plate: string
  ): Promise<Vehicle> {
    return this.vehicleService.findByLicensePlate(plate);
  }

  /**
   * Find a vehicle by VIN
   */
  @Get('/search/vin/{vin}')
  public async getVehicleByVin(
    @Path() vin: string
  ): Promise<Vehicle> {
    return this.vehicleService.findByVin(vin);
  }

  /**
   * Get a vehicle by ID
   */
  @Get('/{id}')
  public async getVehicle(@Path() id: string): Promise<Vehicle> {
    return this.vehicleService.findById(id);
  }

  /**
   * Create a new vehicle
   */
  @Post('/')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  @SuccessResponse(201, 'Created')
  public async createVehicle(@Body() body: CreateVehicleDto): Promise<Vehicle> {
    this.setStatus(201);
    return this.vehicleService.create(body);
  }

  /**
   * Bulk create vehicles (admin only)
   */
  @Post('/bulk')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse(201, 'Created')
  public async createVehiclesBulk(@Body() body: BulkCreateVehiclesDto): Promise<Vehicle[]> {
    if (body.items.length > 100) {
      throw new BadRequestError('Cannot create more than 100 vehicles at once');
    }
    this.setStatus(201);
    return this.vehicleService.createBulk(body.items);
  }

  /**
   * Update a vehicle
   */
  @Patch('/{id}')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async updateVehicle(
    @Path() id: string,
    @Body() body: UpdateVehicleDto
  ): Promise<Vehicle> {
    return this.vehicleService.update(id, body);
  }

  /**
   * Update vehicle odometer
   */
  @Patch('/{id}/odometer')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async updateOdometer(
    @Path() id: string,
    @Body() body: { odometer: number }
  ): Promise<Vehicle> {
    return this.vehicleService.updateOdometer(id, body.odometer);
  }

  /**
   * Add an odometer reading (ad-hoc entry)
   */
  @Post('/{id}/odometer-readings')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  @SuccessResponse(201, 'Created')
  public async addOdometerReading(
    @Request() request: AuthenticatedRequest,
    @Path() id: string,
    @Body() body: { reading: number; unit: string; notes?: string | null; updateVehicle?: boolean; source?: string }
  ): Promise<{ reading: VehicleOdometerReading; warning?: string }> {
    this.setStatus(201);
    return this.vehicleService.addOdometerReading(
      id,
      body.reading,
      body.unit,
      body.notes || null,
      request.user?.id || null,
      body.updateVehicle !== false, // Default to true
      body.source || 'adhoc'
    );
  }

  /**
   * Get odometer reading history for a vehicle
   */
  @Get('/{id}/odometer-readings')
  public async getOdometerHistory(
    @Path() id: string
  ): Promise<VehicleOdometerReading[]> {
    return this.vehicleService.getOdometerHistory(id);
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
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  @SuccessResponse(204, 'Deleted')
  public async deleteVehicle(@Path() id: string): Promise<void> {
    this.setStatus(204);
    return this.vehicleService.delete(id);
  }
}

