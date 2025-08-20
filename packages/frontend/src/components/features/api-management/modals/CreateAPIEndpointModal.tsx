import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Code, Database, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAPIEndpoints } from '../../../../hooks/useAPIEndpoints';

interface APIGroup {
  id: string;
  name: string;
  displayName?: string;
  color: string;
}

interface DatabaseTable {
  id: string;
  name: string;
  displayName?: string;
}

interface Parameter {
  name: string;
  displayName?: string;
  type: 'query' | 'path' | 'header' | 'body' | 'formData';
  dataType: 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object' | 'file';
  required: boolean;
  defaultValue?: string;
  description?: string;
  example?: string;
}

interface Response {
  statusCode: string;
  description?: string;
  contentType: string;
  example?: string;
  isDefault: boolean;
}

interface FormData {
  name: string;
  displayName?: string;
  method: string;
  path: string;
  summary?: string;
  description?: string;
  tags: string;
  groupId?: string;
  relatedTableId?: string;
  authRequired: boolean;
  authType?: string;
  contentType: string;
  deprecated: boolean;
  version: string;
  status: string;
  implementationStatus: string;
  testStatus: string;
  isPublic: boolean;
  parameters: Parameter[];
  responses: Response[];
}

interface CreateAPIEndpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  groups?: APIGroup[];
  databaseTables?: DatabaseTable[];
  onSuccess?: () => void;
}

export const CreateAPIEndpointModal: React.FC<CreateAPIEndpointModalProps> = ({
  isOpen,
  onClose,
  projectId,
  groups = [],
  databaseTables = [],
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { createEndpoint } = useAPIEndpoints(projectId);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      displayName: '',
      method: 'GET',
      path: '',
      summary: '',
      description: '',
      tags: '',
      groupId: '',
      relatedTableId: '',
      authRequired: false,
      authType: '',
      contentType: 'application/json',
      deprecated: false,
      version: '1.0.0',
      status: 'DRAFT',
      implementationStatus: 'NOT_IMPLEMENTED',
      testStatus: 'NOT_TESTED',
      isPublic: false,
      parameters: [],
      responses: [
        {
          statusCode: '200',
          description: '成功',
          contentType: 'application/json',
          example: '',
          isDefault: true
        }
      ]
    }
  });

  const {
    fields: parameterFields,
    append: appendParameter,
    remove: removeParameter
  } = useFieldArray({
    control,
    name: 'parameters'
  });

  const {
    fields: responseFields,
    append: appendResponse,
    remove: removeResponse
  } = useFieldArray({
    control,
    name: 'responses'
  });

  const watchedMethod = watch('method');
  const watchedAuthRequired = watch('authRequired');

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // 处理标签
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      // 处理参数
      const parameters = data.parameters.map(param => ({
        ...param,
        displayName: param.displayName || param.name
      }));

      // 处理响应
      const responses = data.responses.map(response => ({
        ...response,
        example: response.example ? JSON.parse(response.example || '{}') : undefined
      }));

      await createEndpoint({
        ...data,
        tags,
        parameters,
        responses,
        createdBy: 'current-user' // TODO: 从认证状态获取
      });

      toast.success(`API接口 "${data.name}" 已创建`);
      onSuccess?.();
      handleClose();
    } catch (error) {
      toast.error(error.message || '创建API接口时出现错误');
    } finally {
      setLoading(false);
    }
  };

  const addParameter = () => {
    appendParameter({
      name: '',
      type: 'query',
      dataType: 'string',
      required: false,
      description: ''
    });
  };

  const addResponse = () => {
    appendResponse({
      statusCode: '400',
      description: '',
      contentType: 'application/json',
      example: '',
      isDefault: false
    });
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'bg-green-500',
      POST: 'bg-primary-50 dark:bg-primary-900/20',
      PUT: 'bg-orange-500',
      PATCH: 'bg-yellow-500',
      DELETE: 'bg-red-500',
      HEAD: 'bg-bg-tertiary0',
      OPTIONS: 'bg-purple-500'
    };
    return colors[method] || 'bg-bg-tertiary0';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={handleClose} />
        
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-bg-paper rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <Code className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-text-primary">创建API接口</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-text-tertiary hover:text-text-secondary"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Body with Tabs */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6 border-b">
                {['基本信息', '参数定义', '响应定义', '高级设置'].map((tab, index) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(index)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                      activeTab === index
                        ? 'text-blue-600 border-blue-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-text-tertiary border-transparent hover:text-text-secondary hover:border-border-primary'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {/* 基本信息 */}
                {activeTab === 0 && (
                  <div className="space-y-6">
                    {/* HTTP方法和路径 */}
                    <div className="bg-bg-tertiary rounded-lg p-4">
                      <h4 className="text-sm font-medium text-text-primary mb-4">请求配置</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            HTTP方法
                          </label>
                          <Controller
                            name="method"
                            control={control}
                            rules={{ required: '请选择HTTP方法' }}
                            render={({ field }) => (
                              <select 
                                {...field}
                                className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option>
                                <option value="DELETE">DELETE</option>
                                <option value="HEAD">HEAD</option>
                                <option value="OPTIONS">OPTIONS</option>
                              </select>
                            )}
                          />
                          {errors.method && (
                            <p className="mt-1 text-sm text-red-600">{errors.method.message}</p>
                          )}
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            API路径
                          </label>
                          <Controller
                            name="path"
                            control={control}
                            rules={{ 
                              required: 'API路径不能为空',
                              pattern: {
                                value: /^\/.*$/,
                                message: 'API路径必须以/开头'
                              }
                            }}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="text"
                                placeholder="/api/v1/users"
                                className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                            )}
                          />
                          {errors.path && (
                            <p className="mt-1 text-sm text-red-600">{errors.path.message}</p>
                          )}
                        </div>
                      </div>

                      {/* 路径预览 */}
                      <div className="mt-4 p-3 bg-bg-paper rounded-md border border-border-primary">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium text-white rounded ${getMethodColor(watchedMethod)}`}>
                            {watchedMethod}
                          </span>
                          <span className="font-mono text-sm text-text-secondary">
                            {watch('path') || '/api/v1/example'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 基本信息 */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-text-primary">基本信息</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            接口名称 *
                          </label>
                          <Controller
                            name="name"
                            control={control}
                            rules={{ required: '接口名称不能为空' }}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="text"
                                placeholder="getUserById"
                                className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                            )}
                          />
                          {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            显示名称
                          </label>
                          <Controller
                            name="displayName"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="text"
                                placeholder="根据ID获取用户"
                                className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                            )}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          简要描述
                        </label>
                        <Controller
                          name="summary"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              placeholder="根据用户ID获取用户详细信息"
                              className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          详细描述
                        </label>
                        <Controller
                          name="description"
                          control={control}
                          render={({ field }) => (
                            <textarea
                              {...field}
                              rows={3}
                              placeholder="详细描述API的功能、用途、注意事项等..."
                              className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            所属分组
                          </label>
                          <Controller
                            name="groupId"
                            control={control}
                            render={({ field }) => (
                              <select 
                                {...field}
                                className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">选择分组</option>
                                {groups.map(group => (
                                  <option key={group.id} value={group.id}>
                                    {group.displayName || group.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            关联数据表
                          </label>
                          <Controller
                            name="relatedTableId"
                            control={control}
                            render={({ field }) => (
                              <select 
                                {...field}
                                className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">选择数据表</option>
                                {databaseTables.map(table => (
                                  <option key={table.id} value={table.id}>
                                    {table.displayName || table.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          标签（用逗号分隔）
                        </label>
                        <Controller
                          name="tags"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              placeholder="用户,查询,基础接口"
                              className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 参数定义 */}
                {activeTab === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-text-primary">请求参数</h4>
                      <button
                        type="button"
                        onClick={addParameter}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        添加参数
                      </button>
                    </div>

                    {parameterFields.length === 0 ? (
                      <div className="text-center py-8 text-text-tertiary">
                        暂无参数，点击"添加参数"按钮添加请求参数
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {parameterFields.map((field, index) => (
                          <div key={field.id} className="bg-bg-tertiary rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-sm font-medium text-text-primary">
                                参数 #{index + 1}
                              </h5>
                              <button
                                type="button"
                                onClick={() => removeParameter(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">
                                  参数名称
                                </label>
                                <Controller
                                  name={`parameters.${index}.name`}
                                  control={control}
                                  rules={{ required: '参数名称不能为空' }}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type="text"
                                      placeholder="id"
                                      className="w-full px-2 py-1 text-sm border border-border-primary rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  )}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">
                                  位置
                                </label>
                                <Controller
                                  name={`parameters.${index}.type`}
                                  control={control}
                                  render={({ field }) => (
                                    <select 
                                      {...field}
                                      className="w-full px-2 py-1 text-sm border border-border-primary rounded focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      <option value="query">Query</option>
                                      <option value="path">Path</option>
                                      <option value="header">Header</option>
                                      <option value="body">Body</option>
                                      <option value="formData">Form</option>
                                    </select>
                                  )}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">
                                  类型
                                </label>
                                <Controller
                                  name={`parameters.${index}.dataType`}
                                  control={control}
                                  render={({ field }) => (
                                    <select 
                                      {...field}
                                      className="w-full px-2 py-1 text-sm border border-border-primary rounded focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      <option value="string">String</option>
                                      <option value="integer">Integer</option>
                                      <option value="number">Number</option>
                                      <option value="boolean">Boolean</option>
                                      <option value="array">Array</option>
                                      <option value="object">Object</option>
                                      <option value="file">File</option>
                                    </select>
                                  )}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">
                                  必需
                                </label>
                                <Controller
                                  name={`parameters.${index}.required`}
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="mt-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-border-primary rounded"
                                    />
                                  )}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">
                                  描述
                                </label>
                                <Controller
                                  name={`parameters.${index}.description`}
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type="text"
                                      placeholder="参数描述"
                                      className="w-full px-2 py-1 text-sm border border-border-primary rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  )}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">
                                  示例值
                                </label>
                                <Controller
                                  name={`parameters.${index}.example`}
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type="text"
                                      placeholder="123"
                                      className="w-full px-2 py-1 text-sm border border-border-primary rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 响应定义 */}
                {activeTab === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-text-primary">响应定义</h4>
                      <button
                        type="button"
                        onClick={addResponse}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        添加响应
                      </button>
                    </div>

                    <div className="space-y-4">
                      {responseFields.map((field, index) => (
                        <div key={field.id} className="bg-bg-tertiary rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-medium text-text-primary">
                              响应 #{index + 1}
                            </h5>
                            {responseFields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeResponse(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">
                                状态码
                              </label>
                              <Controller
                                name={`responses.${index}.statusCode`}
                                control={control}
                                render={({ field }) => (
                                  <select 
                                    {...field}
                                    className="w-full px-2 py-1 text-sm border border-border-primary rounded focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <option value="200">200</option>
                                    <option value="201">201</option>
                                    <option value="204">204</option>
                                    <option value="400">400</option>
                                    <option value="401">401</option>
                                    <option value="403">403</option>
                                    <option value="404">404</option>
                                    <option value="422">422</option>
                                    <option value="500">500</option>
                                  </select>
                                )}
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-text-secondary mb-1">
                                描述
                              </label>
                              <Controller
                                name={`responses.${index}.description`}
                                control={control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type="text"
                                    placeholder="响应描述"
                                    className="w-full px-2 py-1 text-sm border border-border-primary rounded focus:ring-blue-500 focus:border-blue-500"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">
                                默认
                              </label>
                              <Controller
                                name={`responses.${index}.isDefault`}
                                control={control}
                                render={({ field }) => (
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="mt-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-border-primary rounded"
                                  />
                                )}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                              响应示例（JSON格式）
                            </label>
                            <Controller
                              name={`responses.${index}.example`}
                              control={control}
                              render={({ field }) => (
                                <textarea
                                  {...field}
                                  rows={3}
                                  placeholder='{"id": 1, "name": "张三"}'
                                  className="w-full px-2 py-1 text-sm font-mono border border-border-primary rounded focus:ring-blue-500 focus:border-blue-500"
                                />
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 高级设置 */}
                {activeTab === 3 && (
                  <div className="space-y-6">
                    <div className="bg-bg-tertiary rounded-lg p-4">
                      <h4 className="text-sm font-medium text-text-primary mb-4">状态设置</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            接口状态
                          </label>
                          <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                              <select 
                                {...field}
                                className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="DRAFT">草稿</option>
                                <option value="DESIGN">设计中</option>
                                <option value="DEVELOPMENT">开发中</option>
                                <option value="TESTING">测试中</option>
                                <option value="COMPLETED">已完成</option>
                                <option value="DEPRECATED">已废弃</option>
                              </select>
                            )}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            实现状态
                          </label>
                          <Controller
                            name="implementationStatus"
                            control={control}
                            render={({ field }) => (
                              <select 
                                {...field}
                                className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="NOT_IMPLEMENTED">未实现</option>
                                <option value="IMPLEMENTING">实现中</option>
                                <option value="IMPLEMENTED">已实现</option>
                                <option value="NEEDS_UPDATE">需更新</option>
                              </select>
                            )}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            测试状态
                          </label>
                          <Controller
                            name="testStatus"
                            control={control}
                            render={({ field }) => (
                              <select 
                                {...field}
                                className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="NOT_TESTED">未测试</option>
                                <option value="TESTING">测试中</option>
                                <option value="PASSED">测试通过</option>
                                <option value="FAILED">测试失败</option>
                                <option value="SKIPPED">已跳过</option>
                              </select>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-bg-tertiary rounded-lg p-4">
                      <h4 className="text-sm font-medium text-text-primary mb-4">安全与版本</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            版本号
                          </label>
                          <Controller
                            name="version"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="text"
                                placeholder="1.0.0"
                                className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                            )}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            内容类型
                          </label>
                          <Controller
                            name="contentType"
                            control={control}
                            render={({ field }) => (
                              <select 
                                {...field}
                                className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="application/json">application/json</option>
                                <option value="application/xml">application/xml</option>
                                <option value="text/plain">text/plain</option>
                                <option value="multipart/form-data">multipart/form-data</option>
                                <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                              </select>
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="flex items-center">
                            <Controller
                              name="authRequired"
                              control={control}
                              render={({ field }) => (
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-border-primary rounded"
                                />
                              )}
                            />
                            <span className="text-sm font-medium text-text-secondary">需要认证</span>
                          </label>
                        </div>

                        <div>
                          <label className="flex items-center">
                            <Controller
                              name="deprecated"
                              control={control}
                              render={({ field }) => (
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-border-primary rounded"
                                />
                              )}
                            />
                            <span className="text-sm font-medium text-text-secondary">已废弃</span>
                          </label>
                        </div>

                        <div>
                          <label className="flex items-center">
                            <Controller
                              name="isPublic"
                              control={control}
                              render={({ field }) => (
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-border-primary rounded"
                                />
                              )}
                            />
                            <span className="text-sm font-medium text-text-secondary">公开接口</span>
                          </label>
                        </div>
                      </div>

                      {watchedAuthRequired && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            认证类型
                          </label>
                          <Controller
                            name="authType"
                            control={control}
                            render={({ field }) => (
                              <select 
                                {...field}
                                className="w-full px-3 py-2 border border-border-primary rounded-md focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">选择认证类型</option>
                                <option value="BEARER">Bearer Token</option>
                                <option value="API_KEY">API Key</option>
                                <option value="BASIC">Basic Auth</option>
                                <option value="OAUTH2">OAuth 2.0</option>
                              </select>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-bg-tertiary">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-paper border border-border-primary rounded-md hover:bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '创建中...' : '创建API接口'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};