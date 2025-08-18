import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { 
  RefreshCw, 
  X, 
  Database, 
  Globe, 
  Settings, 
  Clock, 
  AlertCircle,
  Plus,
  Trash2,
  Info,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SyncConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  description?: string;
  isActive: boolean;
  autoSync: boolean;
  syncDirection: 'MODEL_TO_API' | 'API_TO_MODEL' | 'BIDIRECTIONAL';
  conflictResolution: 'MANUAL' | 'MODEL_WINS' | 'API_WINS' | 'MERGE';
  namingConvention: 'CAMEL_CASE' | 'SNAKE_CASE' | 'KEBAB_CASE';
  includeTables: string[];
  excludeTables: string[];
  includeFields: string[];
  excludeFields: string[];
  syncInterval?: number;
  tableToEndpointMapping?: Record<string, any>;
  fieldToParameterMapping?: Record<string, any>;
}

export const SyncConfigurationModal: React.FC<SyncConfigurationModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      autoSync: false,
      syncDirection: 'MODEL_TO_API',
      conflictResolution: 'MANUAL',
      namingConvention: 'CAMEL_CASE',
      includeTables: [],
      excludeTables: [],
      includeFields: [],
      excludeFields: [],
      syncInterval: undefined,
      tableToEndpointMapping: {},
      fieldToParameterMapping: {}
    }
  });

  const watchedAutoSync = watch('autoSync');
  const watchedDirection = watch('syncDirection');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/api-management/sync-configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          projectId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('同步配置创建成功');
        reset();
        onClose();
        onSuccess?.();
      } else {
        throw new Error(result.message || '创建同步配置失败');
      }
    } catch (error: any) {
      console.error('保存同步配置失败:', error);
      toast.error(error.message || '保存同步配置失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 0, label: '基本设置', icon: Settings },
    { id: 1, label: '表过滤', icon: Database },
    { id: 2, label: '字段过滤', icon: Clock },
    { id: 3, label: '映射配置', icon: AlertCircle }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-text-primary">同步配置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
            {/* 基本设置 */}
            {activeTab === 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 配置名称 */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      配置名称 <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="name"
                      control={control}
                      rules={{ 
                        required: '请输入配置名称',
                        minLength: { value: 2, message: '配置名称至少2个字符' }
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.name ? 'border-red-300' : 'border-border-primary'
                          }`}
                          placeholder="请输入配置名称"
                        />
                      )}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* 启用状态 */}
                  <div>
                    <label className="flex items-center space-x-3">
                      <Controller
                        name="isActive"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4 text-blue-600 border-border-primary rounded focus:ring-blue-500"
                          />
                        )}
                      />
                      <span className="text-sm font-medium text-text-secondary">启用同步配置</span>
                    </label>
                    <p className="mt-1 text-xs text-text-tertiary ml-7">关闭后将停止此配置的所有同步操作</p>
                  </div>
                </div>

                {/* 配置描述 */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    配置描述
                  </label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={3}
                        className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="请输入配置描述（可选）"
                      />
                    )}
                  />
                </div>

                {/* 同步方向 */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    同步方向
                  </label>
                  <Controller
                    name="syncDirection"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="MODEL_TO_API">数据模型 → API</option>
                        <option value="API_TO_MODEL">API → 数据模型</option>
                        <option value="BIDIRECTIONAL">双向同步</option>
                      </select>
                    )}
                  />
                  <p className="mt-1 text-xs text-text-tertiary">
                    选择同步的方向：从数据模型生成API，从API生成数据模型，或双向同步
                  </p>
                </div>

                {/* 基本配置 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 自动同步 */}
                  <div>
                    <label className="flex items-center space-x-3">
                      <Controller
                        name="autoSync"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4 text-blue-600 border-border-primary rounded focus:ring-blue-500"
                          />
                        )}
                      />
                      <span className="text-sm font-medium text-text-secondary">启用自动同步</span>
                    </label>
                    <p className="mt-1 text-xs text-text-tertiary ml-7">数据模型或API变更时自动触发同步</p>
                  </div>

                  {/* 命名约定 */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      命名约定
                    </label>
                    <Controller
                      name="namingConvention"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="CAMEL_CASE">驼峰命名 (camelCase)</option>
                          <option value="SNAKE_CASE">下划线命名 (snake_case)</option>
                          <option value="KEBAB_CASE">短横线命名 (kebab-case)</option>
                        </select>
                      )}
                    />
                  </div>
                </div>

                {/* 同步间隔 */}
                {watchedAutoSync && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      同步间隔（分钟）
                    </label>
                    <Controller
                      name="syncInterval"
                      control={control}
                      rules={{ 
                        min: { value: 1, message: '同步间隔不能小于1分钟' },
                        max: { value: 1440, message: '同步间隔不能大于1440分钟（1天）' }
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="1"
                          max="1440"
                          className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="输入同步间隔（分钟）"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      )}
                    />
                    <p className="mt-1 text-xs text-text-tertiary">
                      设置自动同步的时间间隔，留空表示仅在数据变更时同步
                    </p>
                  </div>
                )}

                {/* 冲突解决策略 */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    冲突解决策略
                  </label>
                  <Controller
                    name="conflictResolution"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="MANUAL">手动处理</option>
                        <option value="MODEL_WINS">数据模型优先</option>
                        <option value="API_WINS">API优先</option>
                        <option value="MERGE">自动合并</option>
                      </select>
                    )}
                  />
                  <p className="mt-1 text-xs text-text-tertiary">
                    当检测到冲突时的处理策略
                  </p>
                </div>
              </div>
            )}

            {/* 表过滤配置 */}
            {activeTab === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 包含的表 */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">
                      包含的表（留空表示包含所有表）
                    </label>
                    <Controller
                      name="includeTables"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          value={field.value?.join('\n') || ''}
                          onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                          rows={8}
                          className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="user\nproduct\norder\n支持通配符: user_*"
                        />
                      )}
                    />
                    <p className="mt-1 text-xs text-text-tertiary">
                      每行一个表名或模式，支持通配符（*）
                    </p>
                  </div>

                  {/* 排除的表 */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">
                      排除的表
                    </label>
                    <Controller
                      name="excludeTables"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          value={field.value?.join('\n') || ''}
                          onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                          rows={8}
                          className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="temp_*\nlog_*\ncache_*"
                        />
                      )}
                    />
                    <p className="mt-1 text-xs text-text-tertiary">
                      每行一个表名或模式，这些表将被排除
                    </p>
                  </div>
                </div>

                <div className="bg-primary-50 dark:bg-primary-900/20 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-800 mb-2">
                    <Info className="w-4 h-4" />
                    <span className="text-sm font-medium">过滤规则说明</span>
                  </div>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>• 先应用包含规则，再应用排除规则</p>
                    <p>• 支持通配符：* 匹配任意字符，如 user_* 匹配所有以 user_ 开头的表</p>
                    <p>• 大小写敏感，请确保表名拼写正确</p>
                  </div>
                </div>
              </div>
            )}

            {/* 字段过滤配置 */}
            {activeTab === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 包含的字段 */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">
                      包含的字段（留空表示包含所有字段）
                    </label>
                    <Controller
                      name="includeFields"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          value={field.value?.join('\n') || ''}
                          onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                          rows={8}
                          className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="id\nname\nemail\ncreated_at\n支持通配符: *_id"
                        />
                      )}
                    />
                    <p className="mt-1 text-xs text-text-tertiary">
                      每行一个字段名或模式，支持通配符（*）
                    </p>
                  </div>

                  {/* 排除的字段 */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">
                      排除的字段
                    </label>
                    <Controller
                      name="excludeFields"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          value={field.value?.join('\n') || ''}
                          onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                          rows={8}
                          className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="password\nsalt\ntemp_*\ninternal_*"
                        />
                      )}
                    />
                    <p className="mt-1 text-xs text-text-tertiary">
                      每行一个字段名或模式，这些字段将被排除
                    </p>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-orange-800 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">字段过滤建议</span>
                  </div>
                  <div className="text-xs text-orange-700 space-y-1">
                    <p>• 建议排除敏感字段：password、secret、token 等</p>
                    <p>• 排除系统内部字段：temp_*、internal_*、debug_* 等</p>
                    <p>• 根据业务需要包含或排除特定字段</p>
                  </div>
                </div>
              </div>
            )}

            {/* 映射配置 */}
            {activeTab === 3 && (
              <div className="space-y-6">
                <div className="bg-bg-secondary border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-text-primary mb-4">表到端点映射规则</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        表到端点映射（JSON格式）
                      </label>
                      <Controller
                        name="tableToEndpointMapping"
                        control={control}
                        render={({ field }) => (
                          <textarea
                            {...field}
                            value={JSON.stringify(field.value || {}, null, 2)}
                            onChange={(e) => {
                              try {
                                field.onChange(JSON.parse(e.target.value));
                              } catch {
                                // 保持输入值，即使JSON无效
                              }
                            }}
                            rows={6}
                            className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                            placeholder='{\n  "user": "/api/users",\n  "product": "/api/products",\n  "order": "/api/orders"\n}'
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        字段到参数映射（JSON格式）
                      </label>
                      <Controller
                        name="fieldToParameterMapping"
                        control={control}
                        render={({ field }) => (
                          <textarea
                            {...field}
                            value={JSON.stringify(field.value || {}, null, 2)}
                            onChange={(e) => {
                              try {
                                field.onChange(JSON.parse(e.target.value));
                              } catch {
                                // 保持输入值，即使JSON无效
                              }
                            }}
                            rows={6}
                            className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                            placeholder='{\n  "user_id": "userId",\n  "created_at": "createdAt",\n  "updated_at": "updatedAt"\n}'
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-primary-50 dark:bg-primary-900/20 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-800 mb-2">
                    <Info className="w-4 h-4" />
                    <span className="text-sm font-medium">映射配置说明</span>
                  </div>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>• 表到端点映射：定义数据表对应的API端点路径</p>
                    <p>• 字段到参数映射：定义数据库字段名到API参数名的转换规则</p>
                    <p>• 留空使用默认映射规则（基于命名约定）</p>
                    <p>• 映射规则仅在自动生成API时生效</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-border-primary bg-bg-tertiary">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-text-secondary bg-bg-paper border border-border-primary rounded-lg hover:bg-bg-tertiary disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              )}
              <span>{loading ? '保存中...' : '保存配置'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};