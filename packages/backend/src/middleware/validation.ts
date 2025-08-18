/**
 * 请求验证中间件模块
 * 使用Zod库对Express请求的请求体、查询参数和路径参数进行验证
 */

import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { AppError } from './errorHandler'

/**
 * 格式化Zod验证错误信息
 * 将Zod错误对象转换为易读的错误消息字符串
 * @param error - Zod验证错误对象
 * @returns 格式化后的错误消息字符串
 */
const formatZodError = (error: ZodError): string => {
  return error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
}

/**
 * 验证请求体中间件
 * 使用提供的Zod schema验证请求体数据
 * @param schema - Zod验证模式
 * @returns Express中间件函数
 */
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

/**
 * 验证查询参数中间件
 * 使用提供的Zod schema验证URL查询参数
 * @param schema - Zod验证模式
 * @returns Express中间件函数
 */
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

/**
 * 验证路径参数中间件
 * 使用提供的Zod schema验证URL路径参数
 * @param schema - Zod验证模式
 * @returns Express中间件函数
 */
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

/**
 * 综合请求验证中间件
 * 可同时验证请求体、查询参数和路径参数的组合中间件
 * @param bodySchema - 可选的请求体验证模式
 * @param querySchema - 可选的查询参数验证模式  
 * @param paramsSchema - 可选的路径参数验证模式
 * @returns Express中间件函数
 */
export const validateRequest = (bodySchema?: ZodSchema, querySchema?: ZodSchema, paramsSchema?: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (bodySchema) {
        req.body = bodySchema.parse(req.body)
      }
      if (querySchema) {
        req.query = querySchema.parse(req.query)
      }
      if (paramsSchema) {
        req.params = paramsSchema.parse(req.params)
      }
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError(`Validation error: ${formatZodError(error)}`, 400))
      } else {
        next(new AppError('Validation error', 400))
      }
    }
  }
}