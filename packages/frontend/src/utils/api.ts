import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    throw error
  }
)

// 项目相关API
export const getProjects = async (params?: any) => {
  return apiClient.get('/projects', { params })
}

export const getProject = async (id: string) => {
  return apiClient.get(`/projects/${id}`)
}

export const createProject = async (data: any) => {
  return apiClient.post('/projects', data)
}

export const updateProject = async (id: string, data: any) => {
  return apiClient.put(`/projects/${id}`, data)
}

export const deleteProject = async (id: string) => {
  return apiClient.delete(`/projects/${id}`)
}

export const getProjectStats = async (id: string) => {
  return apiClient.get(`/projects/${id}/stats`)
}

// API相关API
export const getAPIs = async (params?: any) => {
  return apiClient.get('/apis', { params })
}

export const createAPI = async (data: any) => {
  return apiClient.post('/apis', data)
}

export const updateAPI = async (id: string, data: any) => {
  return apiClient.put(`/apis/${id}`, data)
}

export const deleteAPI = async (id: string) => {
  return apiClient.delete(`/apis/${id}`)
}

export const updateAPIStatus = async (id: string, status: string) => {
  return apiClient.patch(`/apis/${id}/status`, { status })
}

export const generateAPICode = async (id: string, options: any) => {
  return apiClient.post(`/apis/${id}/generate-code`, options)
}

// 标签相关API
export const getTags = async (projectId: string) => {
  return apiClient.get(`/tags?projectId=${projectId}`)
}

export const createTag = async (data: any) => {
  return apiClient.post('/tags', data)
}

export const updateTag = async (id: string, data: any) => {
  return apiClient.put(`/tags/${id}`, data)
}

export const deleteTag = async (id: string) => {
  return apiClient.delete(`/tags/${id}`)
}

// Swagger相关API
export const validateSwagger = async (data: any) => {
  return apiClient.post('/swagger/validate', data)
}

export const importSwagger = async (data: any) => {
  return apiClient.post('/swagger/import', data)
}

// 导出API对象
export const apiMethods = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getAPIs,
  createAPI,
  updateAPI,
  deleteAPI,
  updateAPIStatus,
  generateAPICode,
  getTags,
  createTag,
  updateTag,
  deleteTag,
  validateSwagger,
  importSwagger,
}

export default apiMethods