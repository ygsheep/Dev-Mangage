import React, { useState } from 'react';
import { 
  Edit, 
  Trash2, 
  Copy, 
  Play, 
  ExternalLink, 
  Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { APIEndpointDetailModal } from './modals/APIEndpointDetailModal';
import { EditAPIEndpointModal } from './modals/EditAPIEndpointModal';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { CodeGeneratorModal } from './modals/CodeGeneratorModal';
import { TestAPIModal } from './modals/TestAPIModal';

interface APIEndpoint {
  id: string;
  name: string;
  path: string;
  method: string;
  status: string;
  description?: string;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface APIEndpointListProps {
  projectId: string;
  endpoints?: APIEndpoint[];
  loading?: boolean;
  groups?: any[];
  onRefresh?: () => void;
  selectedGroup?: string;
  onGroupChange?: (groupId: string) => void;
}

export const APIEndpointList: React.FC<APIEndpointListProps> = ({
  projectId,
  endpoints = [],
  loading = false,
  groups = [],
  onRefresh,
  selectedGroup,
  onGroupChange
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-text-secondary">加载中...</span>
      </div>
    );
  }

  if (endpoints.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">暂无API接口</p>
        <p className="text-gray-400 text-sm">点击"新建API"按钮创建第一个接口</p>
      </div>
    );
  }

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-100 text-blue-800';
      case 'POST':
        return 'bg-green-100 text-green-800';
      case 'PUT':
        return 'bg-orange-100 text-orange-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DEPRECATED':
        return 'bg-red-100 text-red-800';
      case 'TESTING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetail = (endpoint: APIEndpoint) => {
    setSelectedEndpoint(endpoint);
    setShowDetailModal(true);
  };

  const handleEdit = (endpoint: APIEndpoint) => {
    setSelectedEndpoint(endpoint);
    setShowEditModal(true);
  };

  const handleDelete = (endpoint: APIEndpoint) => {
    setSelectedEndpoint(endpoint);
    setShowDeleteModal(true);
  };

  const handleTest = (endpoint: APIEndpoint) => {
    setSelectedEndpoint(endpoint);
    setShowTestModal(true);
  };

  const handleCodeGenerate = (endpoint: APIEndpoint) => {
    setSelectedEndpoint(endpoint);
    setShowCodeModal(true);
  };

  const handleCopyUrl = (endpoint: APIEndpoint) => {
    const fullUrl = `https://api.example.com${endpoint.path}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('URL已复制到剪贴板');
  };

  return (
    <div className="space-y-6">
      {/* 表格视图 */}
      <div className="bg-bg-paper rounded-lg border border-border-primary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  接口信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  路径
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  方法
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  更新时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-bg-paper divide-y divide-border-primary">
              {endpoints.map((endpoint) => (
                <tr key={endpoint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {endpoint.name}
                      </div>
                      {endpoint.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {endpoint.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {endpoint.path}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(endpoint.status)}`}>
                      {endpoint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(endpoint.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetail(endpoint)}
                        className="text-blue-600 hover:text-blue-800"
                        title="查看详情"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTest(endpoint)}
                        className="text-green-600 hover:text-green-800"
                        title="测试接口"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(endpoint)}
                        className="text-text-secondary hover:text-gray-800"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopyUrl(endpoint)}
                        className="text-text-secondary hover:text-gray-800"
                        title="复制URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(endpoint)}
                        className="text-red-600 hover:text-red-800"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 模态框 */}
      {selectedEndpoint && (
        <>
          <APIEndpointDetailModal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            endpoint={selectedEndpoint}
            onEdit={() => {
              setShowDetailModal(false);
              setShowEditModal(true);
            }}
            onDelete={() => {
              setShowDetailModal(false);
              setShowDeleteModal(true);
            }}
            onTest={() => {
              setShowDetailModal(false);
              setShowTestModal(true);
            }}
          />

          <EditAPIEndpointModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            endpoint={selectedEndpoint}
            groups={groups}
            onSuccess={() => {
              setShowEditModal(false);
              onRefresh?.();
            }}
          />

          <DeleteConfirmModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="删除API接口"
            message={`确定要删除接口 "${selectedEndpoint?.name}" 吗？此操作不可撤销。`}
            onConfirm={() => {
              if (selectedEndpoint) {
                // TODO: 实现删除逻辑
                console.log('删除接口:', selectedEndpoint.id);
                setShowDeleteModal(false);
                onRefresh?.();
              }
            }}
          />

          <CodeGeneratorModal
            isOpen={showCodeModal}
            onClose={() => setShowCodeModal(false)}
            endpoint={selectedEndpoint}
          />

          <TestAPIModal
            isOpen={showTestModal}
            onClose={() => setShowTestModal(false)}
            endpoint={selectedEndpoint}
          />
        </>
      )}
    </div>
  );
};