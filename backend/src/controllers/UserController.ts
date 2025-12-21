import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Path,
  Route,
  Tags,
  Security,
  Request,
  SuccessResponse,
} from 'tsoa';
import { UserService, CreateUserDto, UpdateProfileDto } from '../services/UserService';
import { User } from '../models/User';

@Route('api/users')
@Tags('Users')
@Security('jwt')
export class UserController extends Controller {
  private userService = new UserService();

  /**
   * Create a new user (admin only)
   */
  @Post('/')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse(201, 'Created')
  public async createUser(
    @Body() body: CreateUserDto,
    @Request() request: { user: User }
  ): Promise<Omit<User, 'passwordHash'>> {
    this.setStatus(201);
    return this.userService.createUser(body, request.user.id);
  }

  /**
   * Get all users (admin only)
   */
  @Get('/')
  @Security('jwt', ['ADMIN'])
  public async getUsers(@Request() request: { user: User }): Promise<Omit<User, 'passwordHash'>[]> {
    return this.userService.findAll();
  }

  /**
   * Get user by ID (admin only)
   */
  @Get('/{id}')
  @Security('jwt', ['ADMIN'])
  public async getUser(
    @Path() id: string,
    @Request() request: { user: User }
  ): Promise<Omit<User, 'passwordHash'>> {
    return this.userService.findById(id);
  }

  /**
   * Suspend a user (admin only)
   */
  @Put('/{id}/suspend')
  @Security('jwt', ['ADMIN'])
  public async suspendUser(
    @Path() id: string,
    @Request() request: { user: User }
  ): Promise<Omit<User, 'passwordHash'>> {
    return this.userService.suspendUser(id, request.user.id);
  }

  /**
   * Activate a user (admin only)
   */
  @Put('/{id}/activate')
  @Security('jwt', ['ADMIN'])
  public async activateUser(
    @Path() id: string,
    @Request() request: { user: User }
  ): Promise<Omit<User, 'passwordHash'>> {
    return this.userService.activateUser(id, request.user.id);
  }

  /**
   * Reset user password (admin only)
   */
  @Post('/{id}/reset-password')
  @Security('jwt', ['ADMIN'])
  @SuccessResponse(200, 'Password reset successfully')
  public async resetPassword(
    @Path() id: string,
    @Request() request: { user: User }
  ): Promise<{ message: string }> {
    await this.userService.resetPassword(id, request.user.id);
    return { message: 'Password reset successfully. User will receive an email with the new password.' };
  }

  /**
   * Check if user can be deleted (admin only)
   */
  @Get('/{id}/can-delete')
  @Security('jwt', ['ADMIN'])
  public async canDeleteUser(
    @Path() id: string,
    @Request() request: { user: User }
  ): Promise<{ canDelete: boolean; reason?: string }> {
    return this.userService.canDeleteUser(id);
  }

  /**
   * Update own profile (name and/or password) (authenticated users)
   */
  @Put('/profile')
  public async updateProfile(
    @Body() body: UpdateProfileDto,
    @Request() request: { user: User }
  ): Promise<Omit<User, 'passwordHash'>> {
    return this.userService.updateProfile(request.user.id, body);
  }
}
