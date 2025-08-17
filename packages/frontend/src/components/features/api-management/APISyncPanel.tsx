import React, { useState } from 'react';
import {
  RefreshCw,
  Settings,
  Check
} from 'lucide-react';
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

interface SyncResult {
  success: boolean;
  message: string;
  createdEndpoints: number;
  updatedEndpoints: number;
  deletedEndpoints: number;
  conflicts: Array<{
    type: string;
    tableId?: string;
    endpointId?: string;
    description: string;
    resolution?: string;
  }>;
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
  const [conflicts, setConflicts] = useState([]);

  const tabs = ['同步配置', '同步历史', '冲突管理'];

  return (
    <div className="space-y-6">
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
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                <Settings size={16} className="mr-2" />
                新建配置
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center h-48 space-y-4">
                <RefreshCw size={48} className="text-gray-400" />
                <p className="text-lg text-text-secondary">同步配置功能开发中</p>
                <p className="text-gray-500 text-center">暂无同步配置，创建配置来自动管理数据模型与API的一致性</p>
                <button 
                  onClick={() => setIsConfigOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                >
                  <Settings size={16} className="mr-2" />
                  创建配置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-bg-paper rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary">同步执行历史</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-500">同步历史功能开发中...</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="bg-bg-paper rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-text-primary">同步冲突管理</h3>
            <button 
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
              disabled={loading}
            >
              <RefreshCw size={16} className="mr-2" />
              检测所有冲突
            </button>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <Check size={48} className="text-green-500" />
              <p className="text-lg text-green-600">暂无同步冲突</p>
              <p className="text-gray-500 text-center">数据模型与API接口保持一致</p>
            </div>
          </div>
        </div>
      )}

      {/* 模态框占位符 */}
      {isConfigOpen && (
        <SyncConfigurationModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          projectId={projectId}
          onSuccess={() => {}}
        />
      )}

      {isConflictOpen && (
        <ConflictResolutionModal
          isOpen={isConflictOpen}
          onClose={() => setIsConflictOpen(false)}
          conflicts={conflicts}
          onResolve={async (resolutions) => {
            console.log('解决冲突:', resolutions);
            setConflicts([]);
            setIsConflictOpen(false);
          }}
        />
      )}
    </div>
  );
};