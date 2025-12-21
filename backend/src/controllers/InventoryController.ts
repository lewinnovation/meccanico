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
  InventoryService,
  CreateInventoryDto,
  UpdateInventoryDto,
  AdjustStockDto,
  PaginatedResult,
} from '../services/InventoryService';
import { Inventory } from '../models/Inventory';

@Route('api/inventory')
@Tags('Inventory')
@Security('jwt')
export class InventoryController extends Controller {
  private inventoryService = new InventoryService();

  /**
   * Get all inventory items with pagination and filters
   */
  @Get('/')
  public async getInventory(
    @Query() page: number = 1,
    @Query() limit: number = 50,
    @Query() search?: string,
    @Query() category?: string,
    @Query() lowStock?: boolean,
    @Query() active?: boolean
  ): Promise<PaginatedResult<Inventory>> {
    return this.inventoryService.findAll(page, limit, search, category, lowStock, active);
  }

  /**
   * Get available categories
   */
  @Get('/categories')
  public async getCategories(): Promise<string[]> {
    return this.inventoryService.getCategories();
  }

  /**
   * Get an inventory item by ID
   */
  @Get('/{id}')
  public async getInventoryItem(@Path() id: string): Promise<Inventory> {
    return this.inventoryService.findById(id);
  }

  /**
   * Get an inventory item by code
   */
  @Get('/code/{code}')
  public async getInventoryItemByCode(@Path() code: string): Promise<Inventory> {
    return this.inventoryService.findByCode(code);
  }

  /**
   * Create a new inventory item
   */
  @Post('/')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse(201, 'Created')
  public async createInventoryItem(@Body() body: CreateInventoryDto): Promise<Inventory> {
    this.setStatus(201);
    return this.inventoryService.create(body);
  }

  /**
   * Update an inventory item
   */
  @Patch('/{id}')
  @Security('jwt', ['ADMIN'])
  public async updateInventoryItem(
    @Path() id: string,
    @Body() body: UpdateInventoryDto
  ): Promise<Inventory> {
    return this.inventoryService.update(id, body);
  }

  /**
   * Delete an inventory item
   */
  @Delete('/{id}')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse(204, 'Deleted')
  public async deleteInventoryItem(@Path() id: string): Promise<void> {
    this.setStatus(204);
    return this.inventoryService.delete(id);
  }

  /**
   * Adjust stock quantity
   */
  @Post('/{id}/adjust-stock')
  @Security('jwt', ['ADMIN'])
  public async adjustStock(
    @Path() id: string,
    @Body() body: AdjustStockDto
  ): Promise<Inventory> {
    return this.inventoryService.adjustStock(id, body);
  }
}

