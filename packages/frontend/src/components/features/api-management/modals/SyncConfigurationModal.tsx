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

interface SyncMapping {
  apiEndpointId: string;
  databaseTableId: string;
  syncDirection: 'api_to_db' | 'db_to_api' | 'bidirectional';
  conflictResolution: 'api_wins' | 'db_wins' | 'manual';
  fieldMappings: Array<{
    apiField: string;
    dbField: string;
    transformation?: string;
  }>;
}

interface FormData {
  name: string;
  description: string;
  isEnabled: boolean;
  syncFrequency: 'manual' | 'realtime' | 'scheduled';
  scheduleExpression?: string;
  retryAttempts: number;
  retryDelay: number;
  timeoutSeconds: number;
  enableConflictDetection: boolean;
  defaultConflictResolution: 'api_wins' | 'db_wins' | 'manual';
  syncMappings: SyncMapping[];
  webhookUrl?: string;
  enableNotifications: boolean;
  notificationEvents: string[];
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
      isEnabled: true,
      syncFrequency: 'manual',
      scheduleExpression: '0 0 * * *',
      retryAttempts: 3,
      retryDelay: 1000,
      timeoutSeconds: 30,
      enableConflictDetection: true,
      defaultConflictResolution: 'manual',
      syncMappings: [],
      webhookUrl: '',
      enableNotifications: true,
      notificationEvents: ['sync_success', 'sync_failure', 'conflict_detected']
    }
  });

  const { fields: mappingFields, append: addMapping, remove: removeMapping } = useFieldArray({
    control,
    name: 'syncMappings'
  });

  const watchedFrequency = watch('syncFrequency');
  const watchedNotifications = watch('enableNotifications');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // 这里应该调用API保存同步配置
      console.log('保存同步配置:', data);
      
      toast.success('同步配置保存成功');
      reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('保存同步配置失败:', error);
      toast.error('保存同步配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMapping = () => {
    addMapping({
      apiEndpointId: '',
      databaseTableId: '',
      syncDirection: 'api_to_db',
      conflictResolution: 'manual',
      fieldMappings: []
    });
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 0, label: '基本设置', icon: Settings },
    { id: 1, label: '同步映射', icon: Database },
    { id: 2, label: '调度配置', icon: Clock },
    { id: 3, label: '通知设置', icon: AlertCircle }
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
                        name="isEnabled"
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
                      <span className="text-sm font-medium text-text-secondary">启用同步</span>
                    </label>
                    <p className="mt-1 text-xs text-text-tertiary ml-7">关闭后将停止所有同步操作</p>
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

                {/* 同步频率 */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    同步频率
                  </label>
                  <Controller
                    name="syncFrequency"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="manual">手动触发</option>
                        <option value="realtime">实时同步</option>
                        <option value="scheduled">定时同步</option>
                      </select>
                    )}
                  />
                </div>

                {/* 性能配置 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      重试次数
                    </label>
                    <Controller
                      name="retryAttempts"
                      control={control}
                      rules={{ 
                        min: { value: 0, message: '重试次数不能小于0' },
                        max: { value: 10, message: '重试次数不能大于10' }
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="0"
                          max="10"
                          className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      重试间隔(ms)
                    </label>
                    <Controller
                      name="retryDelay"
                      control={control}
                      rules={{ 
                        min: { value: 100, message: '重试间隔不能小于100ms' },
                        max: { value: 60000, message: '重试间隔不能大于60秒' }
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="100"
                          max="60000"
                          step="100"
                          className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      超时时间(秒)
                    </label>
                    <Controller
                      name="timeoutSeconds"
                      control={control}
                      rules={{ 
                        min: { value: 5, message: '超时时间不能小于5秒' },
                        max: { value: 300, message: '超时时间不能大于300秒' }
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="5"
                          max="300"
                          className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* 冲突检测 */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-3">
                      <Controller
                        name="enableConflictDetection"
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
                      <span className="text-sm font-medium text-text-secondary">启用冲突检测</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      默认冲突解决策略
                    </label>
                    <Controller
                      name="defaultConflictResolution"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="manual">手动解决</option>
                          <option value="api_wins">API数据优先</option>
                          <option value="db_wins">数据库数据优先</option>
                        </select>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 同步映射 */}
            {activeTab === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-text-primary">API与数据表映射</h3>
                  <button
                    type="button"
                    onClick={handleAddMapping}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>添加映射</span>
                  </button>
                </div>

                {mappingFields.length === 0 ? (
                  <div className="text-center py-12">
                    <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-text-tertiary">暂无同步映射，请点击上方按钮添加</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mappingFields.map((field, index) => (
                      <div key={field.id} className="border border-border-primary rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-text-primary">映射 #{index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeMapping(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                              API端点
                            </label>
                            <Controller
                              name={`syncMappings.${index}.apiEndpointId`}
                              control={control}
                              render={({ field }) => (
                                <select
                                  {...field}
                                  className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">选择API端点</option>
                                  {/* 这里应该从API获取端点列表 */}
                                </select>
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                              数据表
                            </label>
                            <Controller
                              name={`syncMappings.${index}.databaseTableId`}
                              control={control}
                              render={({ field }) => (
                                <select
                                  {...field}
                                  className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">选择数据表</option>
                                  {/* 这里应该从API获取数据表列表 */}
                                </select>
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                              同步方向
                            </label>
                            <Controller
                              name={`syncMappings.${index}.syncDirection`}
                              control={control}
                              render={({ field }) => (
                                <select
                                  {...field}
                                  className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="api_to_db">API → 数据库</option>
                                  <option value="db_to_api">数据库 → API</option>
                                  <option value="bidirectional">双向同步</option>
                                </select>
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                              冲突解决
                            </label>
                            <Controller
                              name={`syncMappings.${index}.conflictResolution`}
                              control={control}
                              render={({ field }) => (
                                <select
                                  {...field}
                                  className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="manual">手动解决</option>
                                  <option value="api_wins">API数据优先</option>
                                  <option value="db_wins">数据库数据优先</option>
                                </select>
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

            {/* 调度配置 */}
            {activeTab === 2 && (
              <div className="space-y-6">
                {watchedFrequency === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Cron表达式
                    </label>
                    <Controller
                      name="scheduleExpression"
                      control={control}
                      rules={{
                        required: watchedFrequency === 'scheduled' ? 'Cron表达式不能为空' : false
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0 0 * * *"
                        />
                      )}
                    />
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-blue-800 mb-2">
                        <Info className="w-4 h-4" />
                        <span className="text-sm font-medium">Cron表达式说明</span>
                      </div>
                      <div className="text-xs text-blue-700 space-y-1">
                        <p>格式：分 时 日 月 周</p>
                        <p>示例：0 0 * * * (每天凌晨执行)</p>
                        <p>示例：0 */2 * * * (每两小时执行)</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-bg-tertiary rounded-lg">
                  <h4 className="font-medium text-text-primary mb-2">预设调度模板</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: '每小时', value: '0 * * * *' },
                      { label: '每天凌晨', value: '0 0 * * *' },
                      { label: '每周一', value: '0 0 * * 1' },
                      { label: '每月1号', value: '0 0 1 * *' }
                    ].map((template) => (
                      <button
                        key={template.value}
                        type="button"
                        onClick={() => setValue('scheduleExpression', template.value)}
                        className="text-left px-3 py-2 border border-border-primary rounded-lg hover:bg-bg-paper hover:border-blue-300 transition-colors"
                      >
                        <div className="font-medium text-sm text-text-primary">{template.label}</div>
                        <div className="text-xs text-text-tertiary">{template.value}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 通知设置 */}
            {activeTab === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="flex items-center space-x-3">
                    <Controller
                      name="enableNotifications"
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
                    <span className="text-sm font-medium text-text-secondary">启用通知</span>
                  </label>
                </div>

                {watchedNotifications && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Webhook URL
                      </label>
                      <Controller
                        name="webhookUrl"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="url"
                            className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://example.com/webhook"
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-3">
                        通知事件
                      </label>
                      <div className="space-y-2">
                        {[
                          { id: 'sync_success', label: '同步成功', icon: CheckCircle },
                          { id: 'sync_failure', label: '同步失败', icon: AlertCircle },
                          { id: 'conflict_detected', label: '检测到冲突', icon: AlertCircle },
                          { id: 'schedule_triggered', label: '定时任务触发', icon: Calendar }
                        ].map((event) => {
                          const Icon = event.icon;
                          return (
                            <label key={event.id} className="flex items-center space-x-3">
                              <Controller
                                name="notificationEvents"
                                control={control}
                                render={({ field }) => (
                                  <input
                                    type="checkbox"
                                    checked={field.value?.includes(event.id)}
                                    onChange={(e) => {
                                      const currentEvents = field.value || [];
                                      if (e.target.checked) {
                                        field.onChange([...currentEvents, event.id]);
                                      } else {
                                        field.onChange(currentEvents.filter(ev => ev !== event.id));
                                      }
                                    }}
                                    className="w-4 h-4 text-blue-600 border-border-primary rounded focus:ring-blue-500"
                                  />
                                )}
                              />
                              <Icon className="w-4 h-4 text-text-tertiary" />
                              <span className="text-sm text-text-secondary">{event.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
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