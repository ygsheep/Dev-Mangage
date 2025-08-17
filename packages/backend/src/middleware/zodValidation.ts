import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 验证请求数据
      const validatedData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });

      // 将验证后的数据放回请求对象
      req.body = validatedData.body || req.body;
      req.query = validatedData.query || req.query;
      req.params = validatedData.params || req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(err => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });

        return res.status(400).json({
          success: false,
          message: '请求参数验证失败',
          errors: errorMessages
        });
      }

      next(error);
    }
  };
};