import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Server, Database, GitBranch,
  Calendar, Clock, Eye, Edit, Download, Activity, Bug 
} from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  overview: {
    totalProjects: number;
    totalApis: number;
    totalTags: number;
    totalTables: number;
    totalIssues: number;
    openIssues: number;
    lastUpdated?: string;
  };
  apiStats?: {
    statusDistribution: Array<{ name: string; value: number; color: string }>;
    methodDistribution: Array<{ name: string; value: number; color: string }>;
  };
  tagStats?: Array<{ name: string; value: number }>;
  tableStats?: {
    totalTables: number;
    totalFields: number;
    totalIndexes: number;
    avgFieldsPerTable: number;
  };
  recentProjects?: Array<{
    id: string;
    name: string;
    description: string;
    updatedAt: string;
    stats: {
      apis: number;
      tags: number;
      tables: number;
      issues: number;
    };
  }>;
  globalApiStats?: Array<{ name: string; value: number; color: string }>;
  trends?: Array<{
    date: string;
    apis?: number;
    tags?: number;
    tables?: number;
    issues?: number;
    projects?: number;
    activeUsers?: number;
  }>;
}

interface AnalyticsData {
  timeRange: string;
  period: { start: string; end: string };
  activities: Array<{
    date: string;
    views: number;
    edits: number;
    imports: number;
  }>;
  popularApis: Array<{
    id: string;
    name: string;
    method: string;
    path: string;
    project: string;
    tags: string[];
    usageCount: number;
  }>;
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
    bounceRate: string;
  };
}

export const DashboardPage: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | '90d'>('7d');

  // 获取仪表板统计数据
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', selectedProject],
    queryFn: async () => {
      const params = selectedProject ? `?projectId=${selectedProject}` : '';
      const response = await api.get(`/dashboard/stats${params}`);
      return response;
    },
    refetchInterval: 5 * 60 * 1000, // 每5分钟刷新一次
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // 获取分析数据
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery<AnalyticsData>({
    queryKey: ['dashboard-analytics', selectedProject, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({ timeRange });
      if (selectedProject) params.append('projectId', selectedProject);
      const response = await api.get(`/dashboard/analytics?${params}`);
      return response;
    },
    refetchInterval: 10 * 60 * 1000, // 每10分钟刷新一次
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !statsError, // 只在stats没有错误时才请求analytics
  });

  // 获取项目列表用于选择器
  const { data: projects, error: projectsError } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      // 确保返回的是数组
      return Array.isArray(response) ? response : [];
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });

  useEffect(() => {
    if (statsError) {
      console.error('Stats API 错误:', statsError);
      toast.error('加载统计数据失败，请检查后端服务是否运行');
    }
    if (analyticsError) {
      console.error('Analytics API 错误:', analyticsError);
      toast.error('加载分析数据失败');
    }
    if (projectsError) {
      console.error('Projects API 错误:', projectsError);
      toast.error('加载项目列表失败');
    }
  }, [statsError, analyticsError, projectsError]);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-text-secondary">加载仪表板数据中...</p>
        </div>
      </div>
    );
  }
  
  // 如果统计数据加载失败，显示错误页面
  if (statsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto">
          <div className="text-danger-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">无法加载仪表板数据</h3>
          <p className="text-text-secondary mb-4">请检查后端服务是否正常运行，或联系管理员</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-bg-secondary min-h-screen">
      {/* 页面标题和筛选器 */}
      <div className="bg-bg-paper rounded-lg shadow-theme-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">数据仪表板</h1>
            <p className="text-text-secondary mt-1">实时监控项目状态和使用情况</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* 项目选择器 */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-bg-paper text-text-primary"
            >
              <option value="">全部项目</option>
              {projects && Array.isArray(projects) && projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            {/* 时间范围选择器 */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-bg-paper text-text-primary"
            >
              <option value="1d">最近1天</option>
              <option value="7d">最近7天</option>
              <option value="30d">最近30天</option>
              <option value="90d">最近90天</option>
            </select>
          </div>
        </div>
      </div>

      {/* 概览统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title={selectedProject ? "API接口" : "总项目数"}
          value={selectedProject ? stats?.overview.totalApis || 0 : stats?.overview.totalProjects || 0}
          icon={selectedProject ? Server : GitBranch}
          color="blue"
          trend={null}
        />
        <StatCard
          title={selectedProject ? "标签数量" : "总API数"}
          value={selectedProject ? stats?.overview.totalTags || 0 : stats?.overview.totalApis || 0}
          icon={selectedProject ? GitBranch : Server}
          color="green"
          trend={null}
        />
        <StatCard
          title="数据表"
          value={stats?.overview.totalTables || 0}
          icon={Database}
          color="purple"
          trend={null}
        />
        <StatCard
          title="Issues"
          value={stats?.overview.totalIssues || 0}
          icon={Bug}
          color="orange"
          trend={null}
        />
        <StatCard
          title={selectedProject ? "开放Issues" : "活跃用户"}
          value={selectedProject ? stats?.overview.openIssues || 0 : analytics?.userEngagement.dailyActiveUsers || 0}
          icon={selectedProject ? Bug : Users}
          color={selectedProject ? "orange" : "blue"}
          trend={null}
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API状态分布 */}
        {(stats?.apiStats?.statusDistribution || stats?.globalApiStats) && (
          <div className="bg-bg-paper rounded-lg shadow-theme-md p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">API状态分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.apiStats?.statusDistribution || stats?.globalApiStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(stats?.apiStats?.statusDistribution || stats?.globalApiStats || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* HTTP方法分布 */}
        {stats?.apiStats?.methodDistribution && (
          <div className="bg-bg-paper rounded-lg shadow-theme-md p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">HTTP方法分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.apiStats.methodDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-secondary)" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-primary-600)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 趋势分析 */}
      {stats?.trends && (
        <div className="bg-bg-paper rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {selectedProject ? '项目' : '全局'}趋势分析
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={stats.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-secondary)" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedProject ? (
                <>
                  <Line type="monotone" dataKey="apis" stroke="var(--color-primary-600)" name="API数量" />
                  <Line type="monotone" dataKey="tags" stroke="var(--color-success-600)" name="标签数量" />
                  <Line type="monotone" dataKey="tables" stroke="var(--color-secondary-600)" name="数据表数量" />
                  <Line type="monotone" dataKey="issues" stroke="var(--color-warning-600)" name="Issues数量" />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="projects" stroke="var(--color-primary-600)" name="项目数量" />
                  <Line type="monotone" dataKey="apis" stroke="var(--color-success-600)" name="API数量" />
                  <Line type="monotone" dataKey="issues" stroke="var(--color-warning-600)" name="Issues数量" />
                  <Line type="monotone" dataKey="activeUsers" stroke="var(--color-danger-600)" name="活跃用户" />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 活动分析 */}
      {analytics?.activities && (
        <div className="bg-bg-paper rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">活动分析</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.activities}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-secondary)" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="views" stackId="1" stroke="var(--color-primary-600)" fill="var(--color-primary-600)" name="查看次数" />
              <Area type="monotone" dataKey="edits" stackId="1" stroke="var(--color-success-600)" fill="var(--color-success-600)" name="编辑次数" />
              <Area type="monotone" dataKey="imports" stackId="1" stroke="var(--color-warning-600)" fill="var(--color-warning-600)" name="导入次数" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 底部信息区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 热门标签 */}
        {stats?.tagStats && (
          <div className="bg-bg-paper rounded-lg shadow-theme-md p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">热门标签</h3>
            <div className="space-y-3">
              {stats.tagStats.slice(0, 5).map((tag, index) => (
                <div key={tag.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">#{tag.name}</span>
                  <span className="text-sm text-gray-500">{tag.value}次使用</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 热门API */}
        {analytics?.popularApis && (
          <div className="bg-bg-paper rounded-lg shadow-theme-md p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">热门API</h3>
            <div className="space-y-3">
              {analytics.popularApis.slice(0, 5).map((api) => (
                <div key={api.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(api.method)}`}>
                        {api.method}
                      </span>
                      <span className="text-sm font-medium text-text-primary">{api.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{api.path}</p>
                  </div>
                  <span className="text-sm text-gray-500">{api.usageCount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 最近项目 */}
      {stats?.recentProjects && (
        <div className="bg-bg-paper rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">最近活动项目</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentProjects.map((project) => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-medium text-text-primary">{project.name}</h4>
                <p className="text-sm text-text-secondary mt-1 line-clamp-2">{project.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{project.stats.apiEndpoints} APIs</span>
                    <span>{project.stats.tags} 标签</span>
                    <span>{project.stats.tables} 表</span>
                    <span>{project.stats.issues} Issues</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 统计卡片组件
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend: { value: number; isUp: boolean } | null;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-primary-500 text-white',
    green: 'bg-success-500 text-white',
    purple: 'bg-secondary-500 text-white',
    orange: 'bg-warning-500 text-white',
  };

  return (
    <div className="bg-bg-paper rounded-lg shadow-theme-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value.toLocaleString()}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.isUp ? 'text-success-600' : 'text-error-600'}`}>
              {trend.isUp ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {trend.value}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// 获取HTTP方法颜色
function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    'GET': 'bg-green-100 text-green-800',
    'POST': 'bg-blue-100 text-blue-800',
    'PUT': 'bg-yellow-100 text-yellow-800',
    'DELETE': 'bg-red-100 text-red-800',
    'PATCH': 'bg-purple-100 text-purple-800'
  };
  return colors[method] || 'bg-gray-100 text-gray-800';
}

export default DashboardPage;