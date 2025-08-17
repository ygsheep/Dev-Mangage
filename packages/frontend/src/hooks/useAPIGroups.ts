import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface APIGroup {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  color: string;
  icon?: string;
  sortOrder: number;
  parentId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  children?: APIGroup[];
  endpoints?: Array<{
    id: string;
    name: string;
    method: string;
    status: string;
  }>;
  _count?: {
    endpoints: number;
  };
}

interface UseAPIGroupsReturn {
  groups: APIGroup[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createGroup: (data: any) => Promise<APIGroup>;
  updateGroup: (id: string, data: any) => Promise<APIGroup>;
  deleteGroup: (id: string, options?: { moveEndpointsToGroup?: string }) => Promise<void>;
  moveGroup: (id: string, newParentId?: string) => Promise<APIGroup>;
  reorderGroups: (projectId: string, groupOrders: Array<{ id: string; sortOrder: number }>) => Promise<void>;
}

export const useAPIGroups = (projectId: string): UseAPIGroupsReturn => {
  const [groups, setGroups] = useState<APIGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/api-management/groups?projectId=${projectId}`, {
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
        setGroups(result.data || []);
      } else {
        throw new Error(result.message || '获取API分组列表失败');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('未知错误');
      setError(error);
      console.error('获取API分组列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createGroup = useCallback(async (data: any): Promise<APIGroup> => {
    try {
      const response = await fetch('/api/v1/api-management/groups', {
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
        await fetchGroups(); // 重新获取列表
        toast.success(result.message || 'API分组创建成功');
        return result.data;
      } else {
        throw new Error(result.message || '创建API分组失败');
      }
    } catch (error) {
      console.error('创建API分组失败:', error);
      toast.error(error.message || '创建API分组失败');
      throw error;
    }
  }, [projectId, fetchGroups]);

  const updateGroup = useCallback(async (id: string, data: any): Promise<APIGroup> => {
    try {
      const response = await fetch(`/api/v1/api-management/groups/${id}`, {
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
        await fetchGroups(); // 重新获取列表
        toast.success(result.message || 'API分组更新成功');
        return result.data;
      } else {
        throw new Error(result.message || '更新API分组失败');
      }
    } catch (error) {
      console.error('更新API分组失败:', error);
      toast.error(error.message || '更新API分组失败');
      throw error;
    }
  }, [fetchGroups]);

  const deleteGroup = useCallback(async (
    id: string, 
    options: { moveEndpointsToGroup?: string } = {}
  ): Promise<void> => {
    try {
      const queryParams = new URLSearchParams();
      if (options.moveEndpointsToGroup) {
        queryParams.append('moveEndpointsToGroup', options.moveEndpointsToGroup);
      }

      const url = `/api/v1/api-management/groups/${id}${queryParams.toString() ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url, {
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
        await fetchGroups(); // 重新获取列表
        toast.success(result.message || 'API分组删除成功');
      } else {
        throw new Error(result.message || '删除API分组失败');
      }
    } catch (error) {
      console.error('删除API分组失败:', error);
      toast.error(error.message || '删除API分组失败');
      throw error;
    }
  }, [fetchGroups]);

  const moveGroup = useCallback(async (id: string, newParentId?: string): Promise<APIGroup> => {
    try {
      const response = await fetch(`/api/v1/api-management/groups/${id}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newParentId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        await fetchGroups(); // 重新获取列表
        toast.success(result.message || 'API分组移动成功');
        return result.data;
      } else {
        throw new Error(result.message || '移动API分组失败');
      }
    } catch (error) {
      console.error('移动API分组失败:', error);
      toast.error(error.message || '移动API分组失败');
      throw error;
    }
  }, [fetchGroups]);

  const reorderGroups = useCallback(async (
    projectId: string,
    groupOrders: Array<{ id: string; sortOrder: number }>
  ): Promise<void> => {
    try {
      // 这里可以批量更新分组顺序
      const updatePromises = groupOrders.map(({ id, sortOrder }) =>
        updateGroup(id, { sortOrder })
      );

      await Promise.all(updatePromises);
      toast.success('分组顺序更新成功');
    } catch (error) {
      console.error('更新分组顺序失败:', error);
      toast.error(error.message || '更新分组顺序失败');
      throw error;
    }
  }, [updateGroup]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    refetch: fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    moveGroup,
    reorderGroups
  };
};