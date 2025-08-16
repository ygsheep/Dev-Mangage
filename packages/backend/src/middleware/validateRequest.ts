import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { AppError } from './errorHandler'

/**
 * Express-validator错误处理中间件
 * 检查express-validator的验证结果，如果有错误则抛出AppError
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    // 格式化错误信息
    const errorMessages = errors.array().map(error => {
      return `${error.type === 'field' ? error.path : error.type}: ${error.msg}`
    })
    
    const message = `Validation failed: ${errorMessages.join(', ')}`
    throw new AppError(message, 400)
  }
  
  next()
}

export default validateRequest