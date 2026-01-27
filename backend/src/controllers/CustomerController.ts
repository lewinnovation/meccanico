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
  CustomerService,
  CreateCustomerDto,
  CreateCustomerBulkDto,
  BulkCreateCustomersDto,
  UpdateCustomerDto,
  PaginatedResult,
} from '../services/CustomerService';
import { Customer } from '../models/Customer';
import { BadRequestError } from '../middleware/errorHandler';

@Route('api/customers')
@Tags('Customers')
@Security('jwt')
export class CustomerController extends Controller {
  private customerService = new CustomerService();

  /**
   * Get all customers with pagination and search
   */
  @Get('/')
  public async getCustomers(
    @Query() page: number = 1,
    @Query() limit: number = 50,
    @Query() search?: string
  ): Promise<PaginatedResult<Customer>> {
    return this.customerService.findAll(page, limit, search);
  }

  /**
   * Get a customer by code (e.g., C001)
   */
  @Get('/code/{code}')
  public async getCustomerByCode(@Path() code: string): Promise<Customer> {
    return this.customerService.findByCode(code);
  }

  /**
   * Get a customer by ID
   */
  @Get('/{id}')
  public async getCustomer(@Path() id: string): Promise<Customer> {
    return this.customerService.findById(id);
  }

  /**
   * Create a new customer
   */
  @Post('/')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  @SuccessResponse(201, 'Created')
  public async createCustomer(@Body() body: CreateCustomerDto): Promise<Customer> {
    this.setStatus(201);
    return this.customerService.create(body);
  }

  /**
   * Bulk create customers (admin only)
   */
  @Post('/bulk')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse(201, 'Created')
  public async createCustomersBulk(@Body() body: BulkCreateCustomersDto): Promise<Customer[]> {
    if (body.items.length > 100) {
      throw new BadRequestError('Cannot create more than 100 customers at once');
    }
    this.setStatus(201);
    return this.customerService.createBulk(body.items);
  }

  /**
   * Update a customer
   */
  @Patch('/{id}')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  public async updateCustomer(
    @Path() id: string,
    @Body() body: UpdateCustomerDto
  ): Promise<Customer> {
    return this.customerService.update(id, body);
  }

  /**
   * Delete a customer
   */
  @Delete('/{id}')
  @Security('jwt', ['ADMIN', 'MECHANIC'])
  @SuccessResponse(204, 'Deleted')
  public async deleteCustomer(@Path() id: string): Promise<void> {
    this.setStatus(204);
    return this.customerService.delete(id);
  }
}

