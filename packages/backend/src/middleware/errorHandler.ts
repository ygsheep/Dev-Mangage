import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const createError = (message: string, statusCode: number) => {
  return new AppError(message, statusCode)
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404)
  next(error)
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500
  let message = 'Internal Server Error'

  // Handle operational errors
  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409
        message = 'Resource already exists'
        break
      case 'P2025':
        statusCode = 404
        message = 'Resource not found'
        break
      default:
        statusCode = 400
        message = 'Database error'
    }
  }

  // Handle validation errors
  if (error.name === 'ZodError') {
    statusCode = 400
    message = 'Validation error'
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error)
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  })
}