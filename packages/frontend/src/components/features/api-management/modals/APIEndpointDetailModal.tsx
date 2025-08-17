import React, { useState, useEffect } from 'react';
import { 
  X, 
  Globe, 
  Clock, 
  User, 
  Tag, 
  FileText, 
  Code, 
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Edit,
  Trash2,
  Play,
  Database,
  Settings,
  Eye,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface APIEndpointDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  endpoint: any;
  onEdit?: () => void;
  onDelete?: () => void;
  onTest?: () => void;
}

export const APIEndpointDetailModal: React.FC<APIEndpointDetailModalProps> = ({
  isOpen,
  onClose,
  endpoint,
  onEdit,
  onDelete,
  onTest
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(0);
    }
  }, [isOpen]);

  if (!isOpen || !endpoint) return null;

  const handleCopyUrl = () => {
    const fullUrl = `${endpoint.baseUrl || 'https://api.example.com'}${endpoint.path}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('URL已复制到剪贴板');
  };

  const handleCopyExample = (example: string) => {
    navigator.clipboard.writeText(example);
    toast.success('示例代码已复制到剪贴板');
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
        return 'bg-bg-tertiary text-text-primary';
    }
  };

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
        return 'bg-bg-tertiary text-text-primary';
    }
  };

  const tabs = [
    { id: 0, label: '基本信息', icon: FileText },
    { id: 1, label: '参数详情', icon: Settings },
    { id: 2, label: '响应格式', icon: Code },
    { id: 3, label: '示例代码', icon: Copy },
    { id: 4, label: '测试记录', icon: Activity }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(endpoint.method)}`}>
                {endpoint.method}
              </span>
              <h2 className="text-xl font-semibold text-text-primary truncate max-w-md">
                {endpoint.name || endpoint.path}
              </h2>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(endpoint.status)}`}>
              {endpoint.status}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {onTest && (
              <button
                onClick={onTest}
                className="btn-outline flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>测试</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="btn-outline flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>编辑</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 标签导航 */}
        <div className="border-b border-border-primary">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* 基本信息 */}
          {activeTab === 0 && (
            <div className="space-y-6">
              {/* URL信息 */}
              <div className="bg-bg-tertiary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-text-primary">接口地址</h3>
                  <button
                    onClick={handleCopyUrl}
                    className="btn-outline flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>复制URL</span>
                  </button>
                </div>
                <div className="font-mono text-sm bg-bg-paper border rounded p-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded mr-3 ${getMethodColor(endpoint.method)}`}>
                    {endpoint.method}
                  </span>
                  {endpoint.baseUrl || 'https://api.example.com'}{endpoint.path}
                </div>
              </div>

              {/* 基本属性 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">接口名称</label>
                    <p className="text-text-primary">{endpoint.name || '未命名接口'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">请求方法</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">状态</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(endpoint.status)}`}>
                      {endpoint.status}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">所属分组</label>
                    <p className="text-text-primary">{endpoint.groupName || '无分组'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">创建时间</label>
                    <div className="flex items-center space-x-2 text-text-secondary">
                      <Clock className="w-4 h-4" />
                      <span>{endpoint.createdAt ? new Date(endpoint.createdAt).toLocaleString() : '未知'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">更新时间</label>
                    <div className="flex items-center space-x-2 text-text-secondary">
                      <Clock className="w-4 h-4" />
                      <span>{endpoint.updatedAt ? new Date(endpoint.updatedAt).toLocaleString() : '未知'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">创建者</label>
                    <div className="flex items-center space-x-2 text-text-secondary">
                      <User className="w-4 h-4" />
                      <span>{endpoint.createdBy || '未知用户'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">版本</label>
                    <p className="text-text-primary">{endpoint.version || '1.0.0'}</p>
                  </div>
                </div>
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">接口描述</label>
                <div className="bg-bg-tertiary rounded-lg p-4">
                  <p className="text-text-primary whitespace-pre-wrap">
                    {endpoint.description || '暂无描述'}
                  </p>
                </div>
              </div>

              {/* 标签 */}
              {endpoint.tags && endpoint.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">标签</label>
                  <div className="flex flex-wrap gap-2">
                    {endpoint.tags.map((tag: string, index: number) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 参数详情 */}
          {activeTab === 1 && (
            <div className="space-y-6">
              {/* 请求参数 */}
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">请求参数</h3>
                {endpoint.parameters && endpoint.parameters.length > 0 ? (
                  <div className="overflow-hidden border border-border-primary rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-bg-tertiary">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            参数名
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            类型
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            位置
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            必填
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            描述
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-bg-paper divide-y divide-gray-200">
                        {endpoint.parameters.map((param: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm font-medium text-text-primary">
                              {param.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-text-tertiary">
                              <code className="bg-bg-tertiary px-2 py-1 rounded text-xs">
                                {param.type}
                              </code>
                            </td>
                            <td className="px-4 py-3 text-sm text-text-tertiary">
                              <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                {param.in}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-text-tertiary">
                              {param.required ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-text-tertiary" />
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-text-tertiary">
                              {param.description || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-tertiary">
                    <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>该接口无请求参数</p>
                  </div>
                )}
              </div>

              {/* 请求体示例 */}
              {endpoint.requestBodyExample && (
                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-4">请求体示例</h3>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{JSON.stringify(endpoint.requestBodyExample, null, 2)}</code>
                    </pre>
                    <button
                      onClick={() => handleCopyExample(JSON.stringify(endpoint.requestBodyExample, null, 2))}
                      className="absolute top-2 right-2 p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-300" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 响应格式 */}
          {activeTab === 2 && (
            <div className="space-y-6">
              {/* 响应状态码 */}
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">响应状态码</h3>
                {endpoint.responses && Object.keys(endpoint.responses).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(endpoint.responses).map(([code, response]: [string, any]) => (
                      <div key={code} className="border border-border-primary rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            code.startsWith('2') ? 'bg-green-100 text-green-800' :
                            code.startsWith('4') ? 'bg-yellow-100 text-yellow-800' :
                            code.startsWith('5') ? 'bg-red-100 text-red-800' :
                            'bg-bg-tertiary text-text-primary'
                          }`}>
                            {code}
                          </span>
                          <h4 className="font-medium text-text-primary">{response.description}</h4>
                        </div>
                        {response.example && (
                          <div className="relative mt-3">
                            <pre className="bg-bg-tertiary p-3 rounded text-sm overflow-x-auto">
                              <code>{JSON.stringify(response.example, null, 2)}</code>
                            </pre>
                            <button
                              onClick={() => handleCopyExample(JSON.stringify(response.example, null, 2))}
                              className="absolute top-2 right-2 p-1 bg-bg-paper border border-border-primary hover:bg-bg-tertiary rounded transition-colors"
                            >
                              <Copy className="w-3 h-3 text-text-secondary" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-tertiary">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>暂无响应格式定义</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 示例代码 */}
          {activeTab === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* cURL示例 */}
                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-4">cURL</h3>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`curl -X ${endpoint.method} \\\n  "${endpoint.baseUrl || 'https://api.example.com'}${endpoint.path}" \\\n  -H "Content-Type: application/json"`}</code>
                    </pre>
                    <button
                      onClick={() => handleCopyExample(`curl -X ${endpoint.method} "${endpoint.baseUrl || 'https://api.example.com'}${endpoint.path}" -H "Content-Type: application/json"`)}
                      className="absolute top-2 right-2 p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-300" />
                    </button>
                  </div>
                </div>

                {/* JavaScript示例 */}
                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-4">JavaScript</h3>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`fetch('${endpoint.baseUrl || 'https://api.example.com'}${endpoint.path}', {\n  method: '${endpoint.method}',\n  headers: {\n    'Content-Type': 'application/json'\n  }\n})\n.then(response => response.json())\n.then(data => console.log(data));`}</code>
                    </pre>
                    <button
                      onClick={() => handleCopyExample(`fetch('${endpoint.baseUrl || 'https://api.example.com'}${endpoint.path}', {\n  method: '${endpoint.method}',\n  headers: {\n    'Content-Type': 'application/json'\n  }\n})\n.then(response => response.json())\n.then(data => console.log(data));`)}
                      className="absolute top-2 right-2 p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-300" />
                    </button>
                  </div>
                </div>

                {/* Python示例 */}
                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-4">Python</h3>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`import requests\n\nresponse = requests.${endpoint.method.toLowerCase()}(\n    '${endpoint.baseUrl || 'https://api.example.com'}${endpoint.path}',\n    headers={'Content-Type': 'application/json'}\n)\nprint(response.json())`}</code>
                    </pre>
                    <button
                      onClick={() => handleCopyExample(`import requests\n\nresponse = requests.${endpoint.method.toLowerCase()}(\n    '${endpoint.baseUrl || 'https://api.example.com'}${endpoint.path}',\n    headers={'Content-Type': 'application/json'}\n)\nprint(response.json())`)}
                      className="absolute top-2 right-2 p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-300" />
                    </button>
                  </div>
                </div>

                {/* PHP示例 */}
                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-4">PHP</h3>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`<?php\n$response = file_get_contents(\n    '${endpoint.baseUrl || 'https://api.example.com'}${endpoint.path}',\n    false,\n    stream_context_create([\n        'http' => [\n            'method' => '${endpoint.method}',\n            'header' => 'Content-Type: application/json'\n        ]\n    ])\n);\necho $response;\n?>`}</code>
                    </pre>
                    <button
                      onClick={() => handleCopyExample(`<?php\n$response = file_get_contents(\n    '${endpoint.baseUrl || 'https://api.example.com'}${endpoint.path}',\n    false,\n    stream_context_create([\n        'http' => [\n            'method' => '${endpoint.method}',\n            'header' => 'Content-Type: application/json'\n        ]\n    ])\n);\necho $response;\n?>`)}
                      className="absolute top-2 right-2 p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-300" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 测试记录 */}
          {activeTab === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-text-primary">测试记录</h3>
                {onTest && (
                  <button
                    onClick={onTest}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>执行测试</span>
                  </button>
                )}
              </div>

              {/* 测试历史记录 */}
              <div className="text-center py-12 text-text-tertiary">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>暂无测试记录</p>
                <p className="text-sm">点击上方"执行测试"按钮开始测试</p>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作区 */}
        {(onEdit || onDelete) && (
          <div className="flex items-center justify-between p-6 border-t border-border-primary bg-bg-tertiary">
            <div className="flex items-center space-x-3">
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="px-4 py-2 text-red-600 bg-bg-paper border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除接口</span>
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-secondary bg-bg-paper border border-border-primary rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  );
};