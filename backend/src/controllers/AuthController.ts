import {
  Controller,
  Post,
  Get,
  Body,
  Route,
  Tags,
  Security,
  Request,
} from 'tsoa';
import { AuthService, LoginDto, RegisterDto, AuthResponse } from '../services/AuthService';
import { User } from '../models/User';

@Route('api/auth')
@Tags('Auth')
export class AuthController extends Controller {
  private authService = new AuthService();

  /**
   * Login with email and password
   */
  @Post('/login')
  public async login(@Body() body: LoginDto): Promise<AuthResponse> {
    return this.authService.login(body);
  }

  /**
   * Register a new user (Admin only in production)
   */
  @Post('/register')
  public async register(@Body() body: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(body);
  }

  /**
   * Get current authenticated user
   */
  @Get('/me')
  @Security('jwt')
  public async getCurrentUser(
    @Request() request: { user: User }
  ): Promise<Omit<User, 'passwordHash'>> {
    return this.authService.getCurrentUser(request.user.id);
  }

  /**
   * Refresh access token
   */
  @Post('/refresh')
  @Security('jwt')
  public async refreshToken(
    @Request() request: { user: User }
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refreshTokens(request.user.id);
  }
}

