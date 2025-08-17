import React from 'react';
import {
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  Database,
  Code
} from 'lucide-react';

interface APIEndpoint {
  id: string;
  name: string;
  method: string;
  status: string;
  implementationStatus: string;
  testStatus: string;
  deprecated: boolean;
  authRequired: boolean;
  group?: {
    id: string;
    name: string;
  };
  relatedTable?: {
    id: string;
    name: string;
  };
  syncedFromModel?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface APIGroup {
  id: string;
  name: string;
  displayName?: string;
  endpoints?: APIEndpoint[];
  _count?: {
    endpoints: number;
  };
}

interface APIStatsDashboardProps {
  projectId: string;
  endpoints: APIEndpoint[];
  groups: APIGroup[];
}

export const APIStatsDashboard: React.FC<APIStatsDashboardProps> = ({
  projectId,
  endpoints,
  groups
}) => {
  // 计算基本统计数据
  const totalEndpoints = endpoints?.length || 0;
  const totalGroups = groups?.length || 0;
  const completedEndpoints = endpoints?.filter(e => e.status === 'COMPLETED').length || 0;
  const withTableCount = endpoints?.filter(e => e.relatedTable).length || 0;
  const syncedFromModelCount = endpoints?.filter(e => e.syncedFromModel).length || 0;

  const completionRate = totalEndpoints ? Math.round((completedEndpoints / totalEndpoints) * 100) : 0;
  const associationRate = totalEndpoints ? Math.round((withTableCount / totalEndpoints) * 100) : 0;
  const automationRate = totalEndpoints ? Math.round((syncedFromModelCount / totalEndpoints) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* API接口总数 */}
        <div className="bg-bg-paper rounded-lg border border-border-primary shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-text-secondary">API接口总数</p>
              <p className="text-2xl font-bold text-text-primary">{totalEndpoints}</p>
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <TrendingUp size={16} className="mr-1" />
                <span>共 {totalGroups} 个分组</span>
              </div>
            </div>
          </div>
        </div>

        {/* 已完成接口 */}
        <div className="bg-bg-paper rounded-lg border border-border-primary shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-text-secondary">已完成接口</p>
              <p className="text-2xl font-bold text-text-primary">{completedEndpoints}</p>
              <p className="text-sm text-green-600 mt-1">
                完成率: {completionRate}%
              </p>
            </div>
          </div>
        </div>

        {/* 数据模型关联 */}
        <div className="bg-bg-paper rounded-lg border border-border-primary shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-text-secondary">数据模型关联</p>
              <p className="text-2xl font-bold text-text-primary">{withTableCount}</p>
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <Database size={16} className="mr-1" />
                <span>关联率: {associationRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 自动生成接口 */}
        <div className="bg-bg-paper rounded-lg border border-border-primary shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-text-secondary">自动生成接口</p>
              <p className="text-2xl font-bold text-text-primary">{syncedFromModelCount}</p>
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <Code size={16} className="mr-1" />
                <span>自动化率: {automationRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 占位符内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 状态分布 */}
        <div className="bg-bg-paper rounded-lg border border-border-primary shadow-sm">
          <div className="px-6 py-4 border-b border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary">接口状态分布</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <Activity size={48} className="text-gray-400" />
              <p className="text-text-secondary">状态分布图表开发中</p>
              <p className="text-sm text-gray-500">将展示各状态接口的分布情况</p>
            </div>
          </div>
        </div>

        {/* HTTP方法分布 */}
        <div className="bg-bg-paper rounded-lg border border-border-primary shadow-sm">
          <div className="px-6 py-4 border-b border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary">HTTP方法分布</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <Activity size={48} className="text-gray-400" />
              <p className="text-text-secondary">方法分布图表开发中</p>
              <p className="text-sm text-gray-500">将展示各HTTP方法的使用分布</p>
            </div>
          </div>
        </div>
      </div>

      {/* 实现和测试状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-paper rounded-lg border border-border-primary shadow-sm">
          <div className="px-6 py-4 border-b border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary">实现状态</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center h-32 space-y-2">
              <CheckCircle size={32} className="text-gray-400" />
              <p className="text-text-secondary">实现状态统计开发中</p>
            </div>
          </div>
        </div>

        <div className="bg-bg-paper rounded-lg border border-border-primary shadow-sm">
          <div className="px-6 py-4 border-b border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary">测试状态</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center h-32 space-y-2">
              <AlertCircle size={32} className="text-gray-400" />
              <p className="text-text-secondary">测试状态统计开发中</p>
            </div>
          </div>
        </div>
      </div>

      {/* 其他指标 */}
      {totalEndpoints > 0 && (
        <div className="bg-bg-paper rounded-lg border border-border-primary shadow-sm">
          <div className="px-6 py-4 border-b border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary">其他指标</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">
                  {endpoints?.filter(e => e.deprecated).length || 0}
                </p>
                <p className="text-sm text-text-secondary">已废弃接口</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">
                  {endpoints?.filter(e => e.authRequired).length || 0}
                </p>
                <p className="text-sm text-text-secondary">需要认证</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {syncedFromModelCount}
                </p>
                <p className="text-sm text-text-secondary">模型同步</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {withTableCount}
                </p>
                <p className="text-sm text-text-secondary">关联数据表</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};