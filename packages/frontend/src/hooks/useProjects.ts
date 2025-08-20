import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getBackendBaseUrl } from '../config/env';

// 获取后端基础URL
const API_BASE_URL = getBackendBaseUrl();

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  baseUrl?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    apis: number;
    databaseTables: number;
    apiEndpoints: number;
  };
}

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createProject: (data: any) => Promise<Project>;
  updateProject: (id: string, data: any) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjects = (): UseProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setProjects(result.data.projects || []);
      } else {
        throw new Error(result.message || '获取项目列表失败');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('未知错误');
      setError(error);
      console.error('获取项目列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshTrigger]);

  const createProject = useCallback(async (data: any): Promise<Project> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setRefreshTrigger(prev => prev + 1); // 触发重新获取列表
        toast.success(result.message || '项目创建成功');
        return result.data;
      } else {
        throw new Error(result.message || '创建项目失败');
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      toast.error(error.message || '创建项目失败');
      throw error;
    }
  }, []);

  const updateProject = useCallback(async (id: string, data: any): Promise<Project> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setRefreshTrigger(prev => prev + 1); // 触发重新获取列表
        toast.success(result.message || '项目更新成功');
        return result.data;
      } else {
        throw new Error(result.message || '更新项目失败');
      }
    } catch (error) {
      console.error('更新项目失败:', error);
      toast.error(error.message || '更新项目失败');
      throw error;
    }
  }, []);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setRefreshTrigger(prev => prev + 1); // 触发重新获取列表
        toast.success(result.message || '项目删除成功');
      } else {
        throw new Error(result.message || '删除项目失败');
      }
    } catch (error) {
      console.error('删除项目失败:', error);
      toast.error(error.message || '删除项目失败');
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject
  };
};