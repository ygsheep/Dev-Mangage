import { z } from 'zod'
import { ProjectStatus, APIStatus, HTTPMethod } from './types'

// 项目验证模式
export const ProjectCreateSchema = z.object({
  name: z.string().min(1, '项目名称不能为空').max(100, '项目名称不能超过100个字符'),
  description: z.string().max(500, '项目描述不能超过500个字符').optional(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.ACTIVE)
})

export const ProjectUpdateSchema = ProjectCreateSchema.partial()

// API验证模式
export const APICreateSchema = z.object({
  projectId: z.string().uuid('无效的项目ID'),
  name: z.string().min(1, 'API名称不能为空').max(200, 'API名称不能超过200个字符'),
  method: z.nativeEnum(HTTPMethod, { errorMap: () => ({ message: '无效的HTTP方法' }) }),
  path: z.string().min(1, 'API路径不能为空'),
  description: z.string().max(1000, 'API描述不能超过1000个字符').optional(),
  parameters: z.record(z.any()).optional(),
  responses: z.record(z.any()).optional(),
  status: z.nativeEnum(APIStatus).default(APIStatus.NOT_STARTED),
  frontendCode: z.string().optional(),
  backendCode: z.string().optional(),
  tags: z.array(z.string().uuid()).optional()
})

export const APIUpdateSchema = APICreateSchema.partial().omit({ projectId: true })

// 标签验证模式
export const TagCreateSchema = z.object({
  name: z.string().min(1, '标签名称不能为空').max(50, '标签名称不能超过50个字符'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '无效的颜色格式').default('#3B82F6'),
  projectId: z.string().uuid('无效的项目ID')
})

export const TagUpdateSchema = TagCreateSchema.partial().omit({ projectId: true })

// Swagger导入验证模式
export const SwaggerImportSchema = z.object({
  projectId: z.string().uuid('无效的项目ID'),
  swaggerUrl: z.string().url('无效的URL').optional(),
  swaggerJson: z.record(z.any()).optional()
}).refine(data => data.swaggerUrl || data.swaggerJson, {
  message: '必须提供Swagger URL或JSON数据'
})

// 搜索参数验证模式
export const SearchParamsSchema = z.object({
  query: z.string().min(1, '搜索关键词不能为空'),
  limit: z.number().min(1).max(100).default(10),
  projectId: z.string().uuid().optional(),
  method: z.nativeEnum(HTTPMethod).optional(),
  status: z.nativeEnum(APIStatus).optional(),
  types: z.array(z.enum(['projects', 'apis', 'tags'])).default(['projects', 'apis', 'tags'])
})

// 导出类型
export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>
export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>
export type APICreateInput = z.infer<typeof APICreateSchema>
export type APIUpdateInput = z.infer<typeof APIUpdateSchema>
export type TagCreateInput = z.infer<typeof TagCreateSchema>
export type TagUpdateInput = z.infer<typeof TagUpdateSchema>
export type SwaggerImportInput = z.infer<typeof SwaggerImportSchema>
export type SearchParamsInput = z.infer<typeof SearchParamsSchema>