import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    throw error
  }
)

// 项目相关API
export const getProjects = async () => {
  return api.get('/projects')
}

export const getProject = async (id: string) => {
  return api.get(`/projects/${id}`)
}

export const createProject = async (data: any) => {
  return api.post('/projects', data)
}

export const updateProject = async (id: string, data: any) => {
  return api.put(`/projects/${id}`, data)
}

export const deleteProject = async (id: string) => {
  return api.delete(`/projects/${id}`)
}

export const getProjectStats = async (id: string) => {
  return api.get(`/projects/${id}/stats`)
}

// API相关API
export const getAPIs = async (projectId: string) => {
  return api.get(`/apis?projectId=${projectId}`)
}

export const createAPI = async (data: any) => {
  return api.post('/apis', data)
}

export const updateAPI = async (id: string, data: any) => {
  return api.put(`/apis/${id}`, data)
}

export const deleteAPI = async (id: string) => {
  return api.delete(`/apis/${id}`)
}

// 标签相关API
export const getTags = async (projectId: string) => {
  return api.get(`/tags?projectId=${projectId}`)
}

export const createTag = async (data: any) => {
  return api.post('/tags', data)
}

export const updateTag = async (id: string, data: any) => {
  return api.put(`/tags/${id}`, data)
}

export const deleteTag = async (id: string) => {
  return api.delete(`/tags/${id}`)
}

// Swagger相关API
export const validateSwagger = async (data: any) => {
  return api.post('/swagger/validate', data)
}

export const importSwagger = async (data: any) => {
  return api.post('/swagger/import', data)
}

export default api