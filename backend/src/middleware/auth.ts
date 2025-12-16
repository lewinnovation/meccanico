import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { appConfig } from '../config/app';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * TSOA authentication handler
 * Called by TSOA for routes with @Security decorator
 */
export async function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<User> {
  if (securityName !== 'jwt') {
    throw new Error('Unknown security scheme');
  }

  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, appConfig.jwt.secret) as JwtPayload;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId, isActive: true },
    });

    if (!user) {
      throw new Error('User not found or inactive');
    }

    // Check role-based scopes
    if (scopes && scopes.length > 0) {
      const hasRequiredRole = scopes.some((scope) => {
        if (scope === 'admin') return user.role === UserRole.ADMIN;
        if (scope === 'mechanic') return user.role === UserRole.MECHANIC || user.role === UserRole.ADMIN;
        if (scope === 'viewer') return true; // All authenticated users
        return false;
      });

      if (!hasRequiredRole) {
        throw new Error('Insufficient permissions');
      }
    }

    return user;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Generate JWT tokens
 */
export function generateTokens(user: User): { accessToken: string; refreshToken: string } {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, appConfig.jwt.secret, {
    expiresIn: appConfig.jwt.expiresIn,
  });

  const refreshToken = jwt.sign(payload, appConfig.jwt.secret, {
    expiresIn: appConfig.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
}

