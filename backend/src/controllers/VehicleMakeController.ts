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
  VehicleMakeService,
  CreateVehicleMakeDto,
  UpdateVehicleMakeDto,
  CreateVehicleModelDto,
  UpdateVehicleModelDto,
} from '../services/VehicleMakeService';
import { VehicleMake } from '../models/VehicleMake';
import { VehicleModel } from '../models/VehicleModel';

@Route('api/vehicle-makes')
@Tags('Vehicle Makes')
@Security('jwt')
export class VehicleMakeController extends Controller {
  private service = new VehicleMakeService();

  // ===================== MAKES =====================

  /**
   * Get all vehicle makes
   */
  @Get('/')
  public async getMakes(
    @Query() includeInactive: boolean = false
  ): Promise<VehicleMake[]> {
    return this.service.findAllMakes(includeInactive);
  }

  // ===================== MODELS =====================

  /**
   * Get all vehicle models
   */
  @Get('/models')
  public async getModels(
    @Query() makeId?: string,
    @Query() includeInactive: boolean = false
  ): Promise<VehicleModel[]> {
    return this.service.findAllModels(makeId, includeInactive);
  }

  /**
   * Get models for a specific make
   */
  @Get('/{makeId}/models')
  public async getModelsByMake(
    @Path() makeId: string,
    @Query() includeInactive: boolean = false
  ): Promise<VehicleModel[]> {
    return this.service.findAllModels(makeId, includeInactive);
  }

  /**
   * Get a vehicle model by ID
   */
  @Get('/models/{id}')
  public async getModel(@Path() id: string): Promise<VehicleModel> {
    return this.service.findModelById(id);
  }

  /**
   * Create a new vehicle model
   */
  @Post('/models')
  @SuccessResponse(201, 'Created')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async createModel(@Body() body: CreateVehicleModelDto): Promise<VehicleModel> {
    this.setStatus(201);
    return this.service.createModel(body);
  }

  /**
   * Update a vehicle model
   */
  @Patch('/models/{id}')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async updateModel(
    @Path() id: string,
    @Body() body: UpdateVehicleModelDto
  ): Promise<VehicleModel> {
    return this.service.updateModel(id, body);
  }

  /**
   * Delete a vehicle model
   */
  @Delete('/models/{id}')
  @SuccessResponse(204, 'Deleted')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async deleteModel(@Path() id: string): Promise<void> {
    this.setStatus(204);
    return this.service.deleteModel(id);
  }

  // ===================== MAKES =====================

  /**
   * Get a vehicle make by ID
   */
  @Get('/{id}')
  public async getMake(@Path() id: string): Promise<VehicleMake> {
    return this.service.findMakeById(id);
  }

  /**
   * Create a new vehicle make
   */
  @Post('/')
  @SuccessResponse(201, 'Created')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async createMake(@Body() body: CreateVehicleMakeDto): Promise<VehicleMake> {
    this.setStatus(201);
    return this.service.createMake(body);
  }

  /**
   * Update a vehicle make
   */
  @Patch('/{id}')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async updateMake(
    @Path() id: string,
    @Body() body: UpdateVehicleMakeDto
  ): Promise<VehicleMake> {
    return this.service.updateMake(id, body);
  }

  /**
   * Delete a vehicle make
   */
  @Delete('/{id}')
  @SuccessResponse(204, 'Deleted')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async deleteMake(@Path() id: string): Promise<void> {
    this.setStatus(204);
    return this.service.deleteMake(id);
  }
}

