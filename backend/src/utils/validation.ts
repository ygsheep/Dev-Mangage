import Joi from 'joi'

// 项目验证模式
export const createProjectSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().optional().max(500),
  status: Joi.string().valid('ACTIVE', 'ARCHIVED', 'DELETED').default('ACTIVE')
})

export const updateProjectSchema = Joi.object({
  name: Joi.string().optional().min(1).max(100),
  description: Joi.string().optional().max(500),
  status: Joi.string().valid('ACTIVE', 'ARCHIVED', 'DELETED').optional()
})

// API验证模式
export const createAPISchema = Joi.object({
  projectId: Joi.string().required(),
  name: Joi.string().required().min(1).max(200),
  method: Joi.string().valid('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS').required(),
  path: Joi.string().required().min(1),
  description: Joi.string().optional().max(1000),
  parameters: Joi.object().optional(),
  responses: Joi.object().optional(),
  status: Joi.string().valid('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NOT_TESTED', 'TESTED', 'DEPRECATED').default('NOT_STARTED'),
  frontendCode: Joi.string().optional(),
  backendCode: Joi.string().optional()
})

export const updateAPISchema = Joi.object({
  name: Joi.string().optional().min(1).max(200),
  method: Joi.string().valid('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS').optional(),
  path: Joi.string().optional().min(1),
  description: Joi.string().optional().max(1000),
  parameters: Joi.object().optional(),
  responses: Joi.object().optional(),
  status: Joi.string().valid('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NOT_TESTED', 'TESTED', 'DEPRECATED').optional(),
  frontendCode: Joi.string().optional(),
  backendCode: Joi.string().optional()
})

// 标签验证模式
export const createTagSchema = Joi.object({
  name: Joi.string().required().min(1).max(50),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
  projectId: Joi.string().required()
})

export const updateTagSchema = Joi.object({
  name: Joi.string().optional().min(1).max(50),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional()
})

// 验证中间件函数
export const validateProject = (req: any, res: any, next: any) => {
  const schema = req.method === 'POST' ? createProjectSchema : updateProjectSchema
  const { error } = schema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    })
  }
  
  next()
}

export const validateAPI = (req: any, res: any, next: any) => {
  const schema = req.method === 'POST' ? createAPISchema : updateAPISchema
  const { error } = schema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    })
  }
  
  next()
}

export const validateTag = (req: any, res: any, next: any) => {
  const schema = req.method === 'POST' ? createTagSchema : updateTagSchema
  const { error } = schema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    })
  }
  
  next()
}