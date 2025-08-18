import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Settings,
  Check,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Eye,
  Trash2,
  Plus,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SyncConfigurationModal } from './modals/SyncConfigurationModal';
import { ConflictResolutionModal } from './modals/ConflictResolutionModal';

interface SyncConfiguration {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  autoSync: boolean;
  syncDirection: 'MODEL_TO_API' | 'API_TO_MODEL' | 'BIDIRECTIONAL';
  conflictResolution: 'MANUAL' | 'MODEL_WINS' | 'API_WINS' | 'MERGE';
  lastSyncAt?: string;
  nextSyncAt?: string;
  syncInterval?: number;
  createdAt: string;
  updatedAt: string;
}

interface SyncConflict {
  type: string;
  tableId?: string;
  endpointId?: string;
  description: string;
  resolution?: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  createdEndpoints: number;
  updatedEndpoints: number;
  deletedEndpoints: number;
  conflicts: SyncConflict[];
  errors: string[];
}

interface SyncHistory {
  id: string;
  configId: string;
  startTime: string;
  endTime?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  result?: SyncResult;
}

interface APISyncPanelProps {
  projectId: string;
}

export const APISyncPanel: React.FC<APISyncPanelProps> = ({ projectId }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [syncConfigurations, setSyncConfigurations] = useState<SyncConfiguration[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<SyncConfiguration | null>(null);
  const [isSyncing, setIsSyncing] = useState<{ [key: string]: boolean }>({});

  const tabs = ['同步配置', '同步历史', '冲突管理'];

  // 获取同步配置
  const fetchSyncConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/api-management/sync-configurations?projectId=${projectId}`);
      const data = await response.json();
      
      if (data.success) {
        setSyncConfigurations(data.data);
      } else {
        throw new Error(data.message || '获取同步配置失败');
      }
    } catch (error: any) {
      toast.error(error.message || '获取同步配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取同步历史
  const fetchSyncHistory = async () => {
    try {
      // 这里应该调用真实的API
      // 暂时使用模拟数据
      const mockHistory: SyncHistory[] = [
        {
          id: '1',
          configId: 'config-1',
          startTime: new Date(Date.now() - 3600000).toISOString(),
          endTime: new Date(Date.now() - 3000000).toISOString(),
          status: 'COMPLETED',
          result: {
            success: true,
            message: '同步完成',
            createdEndpoints: 5,
            updatedEndpoints: 2,
            deletedEndpoints: 0,
            conflicts: [],
            errors: []
          }
        }
      ];
      setSyncHistory(mockHistory);
    } catch (error: any) {
      toast.error('获取同步历史失败');
    }
  };

  // 检测冲突
  const detectConflicts = async (configId?: string) => {
    try {
      setLoading(true);
      const targetConfigId = configId || selectedConfig?.id;
      
      if (!targetConfigId) {
        toast.error('请先选择同步配置');
        return;
      }

      const response = await fetch(`/api/v1/api-management/sync-configurations/${targetConfigId}/conflicts`);
      const data = await response.json();
      
      if (data.success) {
        setConflicts(data.data);
        if (data.data.length > 0) {
          setActiveTab(2); // 切换到冲突管理标签
          toast.error(`检测到 ${data.data.length} 个同步冲突`);
        } else {
          toast.success('未检测到同步冲突');
        }
      } else {
        throw new Error(data.message || '检测冲突失败');
      }
    } catch (error: any) {
      toast.error(error.message || '检测冲突失败');
    } finally {
      setLoading(false);
    }
  };

  // 执行同步
  const executeSync = async (configId: string, dryRun: boolean = false) => {
    try {
      setIsSyncing(prev => ({ ...prev, [configId]: true }));
      
      const response = await fetch(`/api/v1/api-management/sync-configurations/${configId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun,
          userId: 'current-user' // 这里应该从认证系统获取
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const result = data.data;
        if (dryRun) {
          toast.success(`预览完成: 将创建 ${result.createdEndpoints} 个端点，更新 ${result.updatedEndpoints} 个端点`);
        } else {
          toast.success(result.message || '同步执行成功');
          fetchSyncHistory(); // 刷新历史记录
        }
      } else {
        throw new Error(data.message || '同步执行失败');
      }
    } catch (error: any) {
      toast.error(error.message || '同步执行失败');
    } finally {
      setIsSyncing(prev => ({ ...prev, [configId]: false }));
    }
  };

  // 删除同步配置
  const deleteSyncConfiguration = async (configId: string) => {
    if (!confirm('确定要删除这个同步配置吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/api-management/sync-configurations/${configId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('同步配置删除成功');
        fetchSyncConfigurations();
      } else {
        throw new Error('删除失败');
      }
    } catch (error: any) {
      toast.error(error.message || '删除同步配置失败');
    }
  };

  useEffect(() => {
    fetchSyncConfigurations();
    fetchSyncHistory();
  }, [projectId]);

  return (
    <div className="space-y-6">
      {/* 同步状态概览 */}
      <div className="bg-bg-paper rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">同步状态概览</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{syncConfigurations.length}</div>
            <div className="text-sm text-gray-600">同步配置</div>
            <div className="text-xs text-gray-500 mt-1">
              活跃: {syncConfigurations.filter(c => c.isActive).length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {syncHistory.filter(h => h.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-gray-600">成功同步</div>
            <div className="text-xs text-gray-500 mt-1">
              今日: {syncHistory.filter(h => h.status === 'COMPLETED' && new Date(h.startTime).toDateString() === new Date().toDateString()).length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{conflicts.length}</div>
            <div className="text-sm text-gray-600">待解决冲突</div>
            <div className="text-xs text-gray-500 mt-1">
              需要注意
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {syncHistory.filter(h => h.status === 'FAILED').length}
            </div>
            <div className="text-sm text-gray-600">失败同步</div>
            <div className="text-xs text-gray-500 mt-1">
              需要检查
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === index
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-text-primary hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 0 && (
        <div className="space-y-6">
          {/* 同步配置 */}
          <div className="bg-bg-paper rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">同步配置管理</h3>
                <p className="text-sm text-text-secondary mt-1">配置数据模型与API接口之间的同步规则</p>
              </div>
              <button 
                onClick={() => setIsConfigOpen(true)}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                <Plus size={16} className="mr-2" />
                新建配置
              </button>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : syncConfigurations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-4">
                  <Settings size={48} className="text-gray-400" />
                  <p className="text-lg text-text-secondary">暂无同步配置</p>
                  <p className="text-gray-500 text-center">创建配置来自动管理数据模型与API的一致性</p>
                  <button 
                    onClick={() => setIsConfigOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                  >
                    <Plus size={16} className="mr-2" />
                    创建配置
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {syncConfigurations.map((config) => (
                    <div 
                      key={config.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-text-primary">{config.name}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              config.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-bg-tertiary text-text-secondary'
                            }`}>
                              {config.isActive ? '已激活' : '已禁用'}
                            </span>
                            {config.autoSync && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Activity size={12} className="mr-1" />
                                自动同步
                              </span>
                            )}
                          </div>
                          {config.description && (
                            <p className="text-text-secondary text-sm mb-2">{config.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>同步方向: {
                              config.syncDirection === 'MODEL_TO_API' ? '模型→API' :
                              config.syncDirection === 'API_TO_MODEL' ? 'API→模型' :
                              '双向同步'
                            }</span>
                            <span>冲突处理: {
                              config.conflictResolution === 'MANUAL' ? '手动处理' :
                              config.conflictResolution === 'MODEL_WINS' ? '模型优先' :
                              config.conflictResolution === 'API_WINS' ? 'API优先' :
                              '自动合并'
                            }</span>
                            {config.lastSyncAt && (
                              <span>上次同步: {new Date(config.lastSyncAt).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => executeSync(config.id, true)}
                            disabled={isSyncing[config.id]}
                            className="inline-flex items-center px-3 py-1.5 text-sm border border-border-secondary rounded-md text-text-secondary bg-bg-paper hover:bg-bg-tertiary disabled:opacity-50"
                          >
                            <Eye size={14} className="mr-1" />
                            预览
                          </button>
                          <button
                            onClick={() => executeSync(config.id, false)}
                            disabled={isSyncing[config.id]}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isSyncing[config.id] ? (
                              <>
                                <RefreshCw size={14} className="mr-1 animate-spin" />
                                同步中
                              </>
                            ) : (
                              <>
                                <Play size={14} className="mr-1" />
                                执行同步
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => detectConflicts(config.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm border border-orange-300 rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100"
                          >
                            <AlertTriangle size={14} className="mr-1" />
                            检测冲突
                          </button>
                          <button
                            onClick={() => deleteSyncConfiguration(config.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm border border-red-300 rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                          >
                            <Trash2 size={14} className="mr-1" />
                            删除
                          </button>
                        </div>
                      </div>
                      
                      {/* 配置详情摘要 */}
                      <div className="bg-bg-secondary rounded-lg p-4 text-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {config.syncInterval && (
                            <div>
                              <span className="text-gray-600">同步间隔:</span>
                              <span className="ml-1 font-medium">{config.syncInterval}分钟</span>
                            </div>
                          )}
                          {config.nextSyncAt && (
                            <div>
                              <span className="text-gray-600">下次同步:</span>
                              <span className="ml-1 font-medium">{new Date(config.nextSyncAt).toLocaleString()}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">创建时间:</span>
                            <span className="ml-1 font-medium">{new Date(config.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">更新时间:</span>
                            <span className="ml-1 font-medium">{new Date(config.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-bg-paper rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">同步执行历史</h3>
              <p className="text-sm text-text-secondary mt-1">查看所有同步操作的执行记录</p>
            </div>
            <button 
              onClick={fetchSyncHistory}
              className="inline-flex items-center px-3 py-2 border border-border-secondary rounded-md text-sm font-medium text-text-secondary bg-bg-paper hover:bg-bg-tertiary"
            >
              <RefreshCw size={16} className="mr-2" />
              刷新
            </button>
          </div>
          <div className="p-6">
            {syncHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-4">
                <Clock size={48} className="text-gray-400" />
                <p className="text-lg text-text-secondary">暂无同步历史</p>
                <p className="text-gray-500 text-center">执行同步操作后，记录将显示在这里</p>
              </div>
            ) : (
              <div className="space-y-4">
                {syncHistory.map((history) => (
                  <div 
                    key={history.id}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          history.status === 'COMPLETED' ? 'bg-green-100' :
                          history.status === 'FAILED' ? 'bg-red-100' :
                          history.status === 'RUNNING' ? 'bg-blue-100' :
                          'bg-bg-tertiary'
                        }`}>
                          {history.status === 'COMPLETED' && <CheckCircle size={16} className="text-green-600" />}
                          {history.status === 'FAILED' && <XCircle size={16} className="text-red-600" />}
                          {history.status === 'RUNNING' && <RefreshCw size={16} className="text-blue-600 animate-spin" />}
                          {history.status === 'CANCELLED' && <Pause size={16} className="text-gray-600" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-primary">
                            同步执行 - {syncConfigurations.find(c => c.id === history.configId)?.name || '未知配置'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            开始时间: {new Date(history.startTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        history.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        history.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        history.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                        'bg-bg-tertiary text-text-secondary'
                      }`}>
                        {history.status === 'COMPLETED' ? '已完成' :
                         history.status === 'FAILED' ? '失败' :
                         history.status === 'RUNNING' ? '运行中' : '已取消'}
                      </span>
                    </div>

                    {/* 执行结果 */}
                    {history.result && (
                      <div className="bg-bg-secondary rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {history.result.createdEndpoints}
                            </div>
                            <div className="text-sm text-gray-600">新建端点</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {history.result.updatedEndpoints}
                            </div>
                            <div className="text-sm text-gray-600">更新端点</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {history.result.deletedEndpoints}
                            </div>
                            <div className="text-sm text-gray-600">删除端点</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {history.result.conflicts.length}
                            </div>
                            <div className="text-sm text-gray-600">冲突数量</div>
                          </div>
                        </div>

                        {/* 错误信息 */}
                        {history.result.errors.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-red-600 mb-2">执行错误:</h5>
                            <ul className="list-disc list-inside space-y-1">
                              {history.result.errors.map((error, index) => (
                                <li key={index} className="text-sm text-red-600">{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 冲突信息 */}
                        {history.result.conflicts.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-orange-600 mb-2">检测到的冲突:</h5>
                            <ul className="list-disc list-inside space-y-1">
                              {history.result.conflicts.map((conflict, index) => (
                                <li key={index} className="text-sm text-orange-600">{conflict.description}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 执行时间 */}
                    <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                      <span>
                        执行时长: {
                          history.endTime 
                            ? Math.round((new Date(history.endTime).getTime() - new Date(history.startTime).getTime()) / 1000)
                            : '计算中'
                        }秒
                      </span>
                      {history.endTime && (
                        <span>完成时间: {new Date(history.endTime).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="bg-bg-paper rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">同步冲突管理</h3>
              <p className="text-sm text-text-secondary mt-1">检测和解决数据模型与API之间的不一致</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedConfig?.id || ''}
                onChange={(e) => setSelectedConfig(syncConfigurations.find(c => c.id === e.target.value) || null)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">选择同步配置</option>
                {syncConfigurations.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => detectConflicts()}
                disabled={loading || !selectedConfig}
                className="inline-flex items-center px-3 py-2 border border-border-secondary text-text-secondary rounded-md text-sm font-medium hover:bg-bg-secondary disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                ) : (
                  <AlertTriangle size={16} className="mr-2" />
                )}
                检测冲突
              </button>
            </div>
          </div>
          <div className="p-6">
            {conflicts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-4">
                <Check size={48} className="text-green-500" />
                <p className="text-lg text-green-600">暂无同步冲突</p>
                <p className="text-gray-500 text-center">
                  {selectedConfig 
                    ? '当前配置的数据模型与API接口保持一致' 
                    : '请选择同步配置并检测冲突'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle size={20} className="text-orange-500" />
                    <span className="text-lg font-semibold text-orange-600">
                      发现 {conflicts.length} 个冲突
                    </span>
                  </div>
                  <button
                    onClick={() => setIsConflictOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
                  >
                    批量解决冲突
                  </button>
                </div>

                {conflicts.map((conflict, index) => (
                  <div 
                    key={index}
                    className="border border-orange-200 bg-orange-50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle size={16} className="text-orange-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-orange-800">
                            {conflict.type === 'field_count_mismatch' ? '字段数量不匹配' :
                             conflict.type === 'field_type_mismatch' ? '字段类型不匹配' :
                             conflict.type === 'missing_parameter' ? '缺少API参数' :
                             conflict.type === 'path_mismatch' ? '路径不匹配' :
                             '其他冲突'}
                          </h4>
                          <p className="text-sm text-orange-700 mt-1">
                            {conflict.description}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {conflict.type}
                      </span>
                    </div>

                    {/* 冲突详情 */}
                    <div className="bg-bg-paper border border-orange-200 rounded-md p-3 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {conflict.tableId && (
                          <div>
                            <span className="font-medium text-text-primary">数据表ID:</span>
                            <span className="ml-2 text-gray-600">{conflict.tableId}</span>
                          </div>
                        )}
                        {conflict.endpointId && (
                          <div>
                            <span className="font-medium text-text-primary">API端点ID:</span>
                            <span className="ml-2 text-gray-600">{conflict.endpointId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 解决方案建议 */}
                    <div className="mt-3 flex items-center space-x-2">
                      <span className="text-sm font-medium text-orange-700">建议解决方案:</span>
                      <div className="flex space-x-2">
                        <button className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200">
                          以模型为准
                        </button>
                        <button className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200">
                          以API为准
                        </button>
                        <button className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200">
                          手动合并
                        </button>
                        <button className="inline-flex items-center px-2 py-1 bg-bg-tertiary text-text-secondary rounded text-xs font-medium hover:bg-bg-secondary">
                          跳过
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 模态框 */}
      {isConfigOpen && (
        <SyncConfigurationModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          projectId={projectId}
          onSuccess={() => {
            fetchSyncConfigurations();
            setIsConfigOpen(false);
            toast.success('同步配置创建成功');
          }}
        />
      )}

      {isConflictOpen && (
        <ConflictResolutionModal
          isOpen={isConflictOpen}
          onClose={() => setIsConflictOpen(false)}
          conflicts={conflicts}
          onResolve={async (resolutions) => {
            try {
              // 这里应该调用冲突解决API
              console.log('解决冲突:', resolutions);
              setConflicts([]);
              setIsConflictOpen(false);
              toast.success('冲突解决成功');
              // 重新检测冲突以确认解决
              if (selectedConfig) {
                detectConflicts(selectedConfig.id);
              }
            } catch (error: any) {
              toast.error(error.message || '解决冲突失败');
            }
          }}
        />
      )}
    </div>
  );
};