import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  RefreshCw, 
  Settings,
  Search,
  Filter,
  Database,
  Globe,
  TestTube,
  BarChart3,
  Folder
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { APIEndpointList } from '../components/features/api-management/APIEndpointList';
import { APIGroupManager } from '../components/features/api-management/APIGroupManager';
import { APIEnvironmentManager } from '../components/features/api-management/APIEnvironmentManager';
import { APITestRunner } from '../components/features/api-management/APITestRunner';
import { APISyncPanel } from '../components/features/api-management/APISyncPanel';
import { APIStatsDashboard } from '../components/features/api-management/APIStatsDashboard';
import { CreateAPIEndpointModal } from '../components/features/api-management/modals/CreateAPIEndpointModal';
import { CreateAPIGroupModal } from '../components/features/api-management/modals/CreateAPIGroupModal';
import { SyncConfigurationModal } from '../components/features/api-management/modals/SyncConfigurationModal';
import { useAPIEndpoints } from '../hooks/useAPIEndpoints';
import { useAPIGroups } from '../hooks/useAPIGroups';
import { useProjects } from '../hooks/useProjects';

export const APIManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentProject = searchParams.get('project');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // 模态框状态
  const [isCreateEndpointOpen, setIsCreateEndpointOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isSyncConfigOpen, setIsSyncConfigOpen] = useState(false);

  // 数据钩子
  const { projects } = useProjects();
  const { 
    endpoints, 
    loading: endpointsLoading, 
    error: endpointsError,
    refetch: refetchEndpoints 
  } = useAPIEndpoints(currentProject || '', {
    groupId: selectedGroup,
    status: statusFilter,
    method: methodFilter,
    search: searchQuery
  });
  
  const { 
    groups, 
    loading: groupsLoading,
    refetch: refetchGroups 
  } = useAPIGroups(currentProject || '');

  // 如果没有选择项目，显示项目选择器
  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="text-xl text-text-secondary">
            请选择一个项目来管理API接口
          </div>
          <div className="max-w-xs">
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => {
                if (e.target.value) {
                  setSearchParams({ project: e.target.value });
                }
              }}
            >
              <option value="">选择项目</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  const currentProjectData = projects?.find(p => p.id === currentProject);

  const handleRefresh = async () => {
    try {
      await refetchEndpoints();
      await refetchGroups();
      toast.success('刷新成功');
    } catch (error: any) {
      toast.error(error.message || '刷新数据时出现错误');
    }
  };

  const handleCreateEndpoint = () => {
    setIsCreateEndpointOpen(true);
  };

  const handleCreateGroup = () => {
    setIsCreateGroupOpen(true);
  };

  const handleSyncConfiguration = () => {
    setIsSyncConfigOpen(true);
  };

  const tabs = [
    { id: 0, label: 'API接口', icon: Globe, count: endpoints?.length },
    { id: 1, label: '分组管理', icon: Folder, count: groups?.length },
    { id: 2, label: '环境配置', icon: Settings },
    { id: 3, label: '接口测试', icon: TestTube },
    { id: 4, label: '同步管理', icon: RefreshCw },
    { id: 5, label: '统计分析', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-bg-paper border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 标题区域 */}
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">API接口管理</h1>
                {currentProjectData && (
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-text-secondary text-sm">项目:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {currentProjectData.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={endpointsLoading || groupsLoading}
                className="btn-outline flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${(endpointsLoading || groupsLoading) ? 'animate-spin' : ''}`} />
                <span>刷新</span>
              </button>
              <button
                onClick={handleSyncConfiguration}
                className="btn-outline flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>同步配置</span>
              </button>
              <button
                onClick={handleCreateGroup}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>新建分组</span>
              </button>
              <button
                onClick={handleCreateEndpoint}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>新建API</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选器区域 */}
      <div className="bg-bg-paper border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1 max-w-xs">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">选择分组</option>
                {groups?.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.displayName || group.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="min-w-0 max-w-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">所有状态</option>
                <option value="DRAFT">草稿</option>
                <option value="DESIGN">设计中</option>
                <option value="DEVELOPMENT">开发中</option>
                <option value="TESTING">测试中</option>
                <option value="COMPLETED">已完成</option>
                <option value="DEPRECATED">已废弃</option>
              </select>
            </div>
            
            <div className="min-w-0 max-w-xs">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">所有方法</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            
            <div className="min-w-0 flex-1 min-w-48">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索API接口..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {endpointsError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="text-red-600">
              {endpointsError.message || '获取API接口数据失败'}
            </div>
          </div>
        </div>
      )}

      {/* 标签导航 */}
      <div className="bg-bg-paper border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 移动端导航 */}
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(parseInt(e.target.value))}
              className="block w-full py-2 pl-3 pr-10 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} {tab.count !== undefined && `(${tab.count})`}
                </option>
              ))}
            </select>
          </div>
          
          {/* 桌面端导航 */}
          <nav className="hidden sm:flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-text-secondary'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API接口列表 */}
        {activeTab === 0 && (
          <APIEndpointList
            projectId={currentProject}
            endpoints={endpoints}
            loading={endpointsLoading}
            groups={groups}
            onRefresh={refetchEndpoints}
            selectedGroup={selectedGroup}
            onGroupChange={setSelectedGroup}
          />
        )}

        {/* 分组管理 */}
        {activeTab === 1 && (
          <APIGroupManager
            projectId={currentProject}
            groups={groups}
            loading={groupsLoading}
            onRefresh={refetchGroups}
          />
        )}

        {/* 环境配置 */}
        {activeTab === 2 && (
          <APIEnvironmentManager
            projectId={currentProject}
          />
        )}

        {/* 接口测试 */}
        {activeTab === 3 && (
          <APITestRunner
            projectId={currentProject}
            endpoints={endpoints}
            groups={groups}
          />
        )}

        {/* 同步管理 */}
        {activeTab === 4 && (
          <APISyncPanel
            projectId={currentProject}
          />
        )}

        {/* 统计分析 */}
        {activeTab === 5 && (
          <APIStatsDashboard
            projectId={currentProject}
            endpoints={endpoints}
            groups={groups}
          />
        )}
      </div>

      {/* 模态框 */}
      <CreateAPIEndpointModal
        isOpen={isCreateEndpointOpen}
        onClose={() => setIsCreateEndpointOpen(false)}
        projectId={currentProject}
        groups={groups}
        onSuccess={() => {
          refetchEndpoints();
          setIsCreateEndpointOpen(false);
        }}
      />

      <CreateAPIGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        projectId={currentProject}
        groups={groups}
        onSuccess={() => {
          refetchGroups();
          setIsCreateGroupOpen(false);
        }}
      />

      <SyncConfigurationModal
        isOpen={isSyncConfigOpen}
        onClose={() => setIsSyncConfigOpen(false)}
        projectId={currentProject}
        onSuccess={() => {
          setIsSyncConfigOpen(false);
        }}
      />
    </div>
  );
};