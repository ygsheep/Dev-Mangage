import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getBackendBaseUrl } from '../config/env';

// 获取后端基础URL
const API_BASE_URL = getBackendBaseUrl();

interface APIEndpoint {
  id: string;
  name: string;
  displayName?: string;
  method: string;
  path: string;
  summary?: string;
  description?: string;
  status: string;
  implementationStatus: string;
  testStatus: string;
  deprecated: boolean;
  authRequired: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
  group?: {
    id: string;
    name: string;
    displayName?: string;
    color: string;
  };
  relatedTable?: {
    id: string;
    name: string;
    displayName?: string;
  };
  parameters?: Array<{
    id: string;
    name: string;
    type: string;
    required: boolean;
  }>;
  responses?: Array<{
    id: string;
    statusCode: string;
    description?: string;
  }>;
  testCases?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  syncedFromModel?: boolean;
  lastSyncAt?: string;
}

interface UseAPIEndpointsFilters {
  groupId?: string;
  status?: string;
  method?: string;
  deprecated?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface UseAPIEndpointsReturn {
  endpoints: APIEndpoint[];
  loading: boolean;
  error: Error | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  refetch: () => Promise<void>;
  createEndpoint: (data: any) => Promise<APIEndpoint>;
  updateEndpoint: (id: string, data: any) => Promise<APIEndpoint>;
  deleteEndpoint: (id: string) => Promise<void>;
  generateFromTable: (tableId: string, operations: string[], options?: any) => Promise<APIEndpoint[]>;
}

export const useAPIEndpoints = (
  projectId: string,
  filters: UseAPIEndpointsFilters = {}
): UseAPIEndpointsReturn => {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchEndpoints = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('projectId', projectId);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`${API_BASE_URL}/api-management/endpoints?${queryParams}`, {
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
        setEndpoints(result.data || []);
        setPagination(result.pagination || {
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0
        });
      } else {
        throw new Error(result.message || '获取API端点列表失败');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('未知错误');
      setError(error);
      console.error('获取API端点列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, JSON.stringify(filters), refreshTrigger]);

  const createEndpoint = useCallback(async (data: any): Promise<APIEndpoint> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-management/endpoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, projectId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setRefreshTrigger(prev => prev + 1); // 触发重新获取列表
        toast.success(result.message || 'API端点创建成功');
        return result.data;
      } else {
        throw new Error(result.message || '创建API端点失败');
      }
    } catch (error) {
      console.error('创建API端点失败:', error);
      toast.error(error.message || '创建API端点失败');
      throw error;
    }
  }, [projectId]);

  const updateEndpoint = useCallback(async (id: string, data: any): Promise<APIEndpoint> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-management/endpoints/${id}`, {
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
        toast.success(result.message || 'API端点更新成功');
        return result.data;
      } else {
        throw new Error(result.message || '更新API端点失败');
      }
    } catch (error) {
      console.error('更新API端点失败:', error);
      toast.error(error.message || '更新API端点失败');
      throw error;
    }
  }, []);

  const deleteEndpoint = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-management/endpoints/${id}`, {
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
        toast.success(result.message || 'API端点删除成功');
      } else {
        throw new Error(result.message || '删除API端点失败');
      }
    } catch (error) {
      console.error('删除API端点失败:', error);
      toast.error(error.message || '删除API端点失败');
      throw error;
    }
  }, []);

  const generateFromTable = useCallback(async (
    tableId: string, 
    operations: string[], 
    options: any = {}
  ): Promise<APIEndpoint[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-management/endpoints/generate-from-table`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId,
          operations,
          options: { ...options, createdBy: 'system' }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setRefreshTrigger(prev => prev + 1); // 触发重新获取列表
        toast.success(result.message || 'API端点生成成功');
        return result.data;
      } else {
        throw new Error(result.message || '生成API端点失败');
      }
    } catch (error) {
      console.error('生成API端点失败:', error);
      toast.error(error.message || '生成API端点失败');
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  return {
    endpoints,
    loading,
    error,
    total: pagination.total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
    refetch: fetchEndpoints,
    createEndpoint,
    updateEndpoint,
    deleteEndpoint,
    generateFromTable
  };
};