import { Request, Response, NextFunction } from 'express';
import { ValidateError } from 'tsoa';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict') {
    super(409, message);
    this.name = 'ConflictError';
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request') {
    super(400, message);
    this.name = 'BadRequestError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  // TSOA validation errors
  if (err instanceof ValidateError) {
    console.warn(`Validation error for ${req.path}:`, err.fields);
    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      details: err.fields,
    });
  }

  // Custom API errors
  if (err instanceof ApiError) {
    const response: { status: string; message: string; details?: unknown } = {
      status: 'error',
      message: err.message,
    };
    if (err.details) {
      response.details = err.details;
    }
    return res.status(err.statusCode).json(response);
  }

  // JWT authentication errors
  if (err.message === 'No token provided' || err.message === 'Invalid token') {
    return res.status(401).json({
      status: 'error',
      message: err.message,
    });
  }

  if (err.message === 'Token expired') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  if (err.message === 'Insufficient permissions') {
    return res.status(403).json({
      status: 'error',
      message: 'Insufficient permissions',
    });
  }

  // Unhandled errors
  console.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    path: req.path,
    method: req.method,
  });
  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

