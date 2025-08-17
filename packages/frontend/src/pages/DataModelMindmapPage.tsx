import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  GitBranch, 
  Settings, 
  Maximize2,
  Grid,
  Eye,
  EyeOff,
  HelpCircle,
  Share2,
  Download
} from 'lucide-react';
import DataModelMindmap from '../components/features/data-visualization/DataModelMindmap';
import { api } from '../utils/api';

export const DataModelMindmapPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [showMinimap, setShowMinimap] = useState(true);
  const [showBackground, setShowBackground] = useState(true);
  const [allowEditing, setAllowEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 获取项目信息
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const response = await api.get(`/api/v1/projects/${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
  });

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-status-error mb-4">项目ID未提供</p>
          <Link
            to="/projects"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            返回项目列表
          </Link>
        </div>
      </div>
    );
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const shareVisualization = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      // toast.success('链接已复制到剪贴板');
      alert('分享链接已复制到剪贴板');
    });
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-bg-primary' : 'space-y-6'}`}>
      {/* 页面头部 */}
      <div className={`${isFullscreen ? 'p-4' : ''} ${isFullscreen ? 'border-b border-border-primary' : 'bg-bg-paper rounded-lg shadow-theme-md p-6'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isFullscreen && (
              <Link
                to={`/projects/${projectId}/data-model`}
                className="p-2 text-text-secondary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="返回数据模型"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            
            <div>
              <div className="flex items-center gap-2">
                <GitBranch className="w-6 h-6 text-primary-600" />
                <h1 className="text-2xl font-bold text-text-primary">数据模型思维导图</h1>
              </div>
              {project && (
                <p className="text-text-secondary mt-1">
                  {project.name} - 数据结构可视化展示
                </p>
              )}
            </div>
          </div>

          {/* 工具栏 */}
          <div className="flex items-center gap-2">
            {/* 显示选项 */}
            <div className="flex items-center gap-2 bg-bg-tertiary rounded-lg p-1">
              <button
                onClick={() => setShowMinimap(!showMinimap)}
                className={`p-2 rounded transition-colors ${
                  showMinimap 
                    ? 'bg-bg-paper text-primary-600 shadow-sm' 
                    : 'text-text-secondary hover:text-primary-600'
                }`}
                title={showMinimap ? '隐藏小地图' : '显示小地图'}
              >
                {showMinimap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => setShowBackground(!showBackground)}
                className={`p-2 rounded transition-colors ${
                  showBackground 
                    ? 'bg-bg-paper text-primary-600 shadow-sm' 
                    : 'text-text-secondary hover:text-primary-600'
                }`}
                title={showBackground ? '隐藏网格背景' : '显示网格背景'}
              >
                <Grid className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setAllowEditing(!allowEditing)}
                className={`p-2 rounded transition-colors ${
                  allowEditing 
                    ? 'bg-bg-paper text-status-warning shadow-sm' 
                    : 'text-text-secondary hover:text-status-warning'
                }`}
                title={allowEditing ? '禁用编辑模式' : '启用编辑模式'}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* 功能按钮 */}
            <button
              onClick={shareVisualization}
              className="p-2 text-text-secondary hover:text-status-success hover:bg-green-50 rounded-lg transition-colors"
              title="分享可视化"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {/* 全屏按钮 */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-text-secondary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title={isFullscreen ? '退出全屏' : '进入全屏'}
            >
              <Maximize2 className="w-5 h-5" />
            </button>

            {/* 帮助按钮 */}
            <button
              onClick={() => {
                alert('数据模型思维导图帮助:\n\n• 蓝色节点：项目根节点\n• 橙色节点：数据表分类\n• 绿色节点：数据表\n• 紫色节点：字段组\n• 实线：层次关系\n• 虚线：外键关系\n• 拖拽节点可以重新排列\n• 使用鼠标滚轮缩放视图');
              }}
              className="p-2 text-text-secondary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="查看帮助"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 思维导图视图 */}
      <div className={isFullscreen ? 'flex-1' : ''}>
        <DataModelMindmap
          projectId={projectId}
          height={isFullscreen ? 'calc(100vh - 100px)' : '800px'}
          className={isFullscreen ? '' : 'bg-bg-paper rounded-lg shadow-theme-md'}
          showMinimap={showMinimap}
          showBackground={showBackground}
          allowEditing={allowEditing}
        />
      </div>

      {/* 图例和说明 */}
      {!isFullscreen && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 节点类型图例 */}
          <div className="bg-bg-paper rounded-lg shadow-theme-md p-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-600" />
              节点类型图例
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded"></div>
                <span className="text-sm text-text-secondary"><span className="font-medium text-text-primary">项目节点</span> - 项目根节点，显示项目总体信息</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-500 rounded"></div>
                <span className="text-sm text-text-secondary"><span className="font-medium text-text-primary">分类节点</span> - 数据表分类，按业务模块分组</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-bg-paper border-2 border-green-300 rounded"></div>
                <span className="text-sm text-text-secondary"><span className="font-medium text-text-primary">表节点</span> - 数据库表，显示字段统计和键信息</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gradient-to-br from-purple-400 to-purple-500 rounded"></div>
                <span className="text-sm text-text-secondary"><span className="font-medium text-text-primary">字段组</span> - 相关字段的逻辑分组</span>
              </div>
            </div>
          </div>

          {/* 连接类型图例 */}
          <div className="bg-bg-paper rounded-lg shadow-theme-md p-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary-600" />
              连接类型图例
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-0.5 bg-orange-500"></div>
                <span className="text-sm text-text-secondary"><span className="font-medium text-text-primary">层次关系</span> - 项目到分类的包含关系</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-0.5 bg-green-500"></div>
                <span className="text-sm text-text-secondary"><span className="font-medium text-text-primary">分组关系</span> - 分类到表的归属关系</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-0.5 border-t-2 border-blue-500 border-dashed"></div>
                <span className="text-sm text-text-secondary"><span className="font-medium text-text-primary">外键关系</span> - 表与表之间的引用关系</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-0.5 bg-purple-500"></div>
                <span className="text-sm text-text-secondary"><span className="font-medium text-text-primary">依赖关系</span> - 字段组之间的依赖</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 操作指南 */}
      {!isFullscreen && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-text-primary mb-2">操作指南</h3>
              <div className="text-sm text-text-secondary grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p>• <span className="font-medium text-text-primary">拖拽移动:</span> 拖拽节点重新排列</p>
                  <p>• <span className="font-medium text-text-primary">缩放视图:</span> 鼠标滚轮或控制按钮</p>
                  <p>• <span className="font-medium text-text-primary">切换布局:</span> 辐射/层次/力导向布局</p>
                </div>
                <div>
                  <p>• <span className="font-medium text-text-primary">折叠节点:</span> 点击表节点的眼睛图标</p>
                  <p>• <span className="font-medium text-text-primary">查看详情:</span> 悬停节点查看更多信息</p>
                  <p>• <span className="font-medium text-text-primary">分享协作:</span> 复制链接分享给团队</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataModelMindmapPage;