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
   * Transfer vehicle to another customer
   */
  @Patch('/{id}/transfer')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async transferVehicle(
    @Path() id: string,
    @Body() body: { newCustomerId: string }
  ): Promise<Vehicle> {
    return this.vehicleService.transferToCustomer(id, body.newCustomerId);
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

