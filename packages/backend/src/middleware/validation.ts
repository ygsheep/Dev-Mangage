import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { AppError } from './errorHandler'

const formatZodError = (error: ZodError): string => {
  return error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
}

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError(`Invalid request body: ${formatZodError(error)}`, 400))
      } else {
        next(new AppError('Invalid request body', 400))
      }
    }
  }
}

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError(`Invalid query parameters: ${formatZodError(error)}`, 400))
      } else {
        next(new AppError('Invalid query parameters', 400))
      }
    }
  }
}

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError(`Invalid path parameters: ${formatZodError(error)}`, 400))
      } else {
        next(new AppError('Invalid path parameters', 400))
      }
    }
  }
}