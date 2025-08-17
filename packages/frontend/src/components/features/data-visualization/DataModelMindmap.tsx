import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  NodeTypes,
} from 'reactflow';
import { 
  Database, 
  Table, 
  Key, 
  Hash, 
  Type,
  Download,
  Settings,
  Maximize2,
  Eye,
  EyeOff,
  GitBranch,
  Layers
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';

// 思维导图节点类型定义
interface MindmapNodeData {
  label: string;
  description?: string;
  type: 'project' | 'category' | 'table' | 'field-group';
  entityId: string;
  entityType: string;
  level: number;
  metadata?: Record<string, any>;
  isCollapsed?: boolean;
  fieldCount?: number;
  primaryKeys?: string[];
  foreignKeys?: string[];
}

// 项目根节点组件
const ProjectNode: React.FC<{ data: MindmapNodeData }> = ({ data }) => (
  <div className="mindmap-node project bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg min-w-[200px]">
    <div className="flex items-center gap-3 mb-2">
      <Database className="w-6 h-6" />
      <h3 className="font-bold text-lg">{data.label}</h3>
    </div>
    {data.description && (
      <p className="text-blue-100 text-sm mb-3">{data.description}</p>
    )}
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="bg-blue-400 bg-opacity-30 rounded px-2 py-1">
        <span className="font-medium">{data.metadata?.tableCount || 0}</span> 表
      </div>
      <div className="bg-blue-400 bg-opacity-30 rounded px-2 py-1">
        <span className="font-medium">{data.metadata?.relationCount || 0}</span> 关系
      </div>
    </div>
  </div>
);

// 分类节点组件
const CategoryNode: React.FC<{ data: MindmapNodeData }> = ({ data }) => (
  <div className="mindmap-node category bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-lg p-4 shadow-md min-w-[150px]">
    <div className="flex items-center gap-2 mb-2">
      <Layers className="w-5 h-5" />
      <h4 className="font-semibold">{data.label}</h4>
    </div>
    {data.description && (
      <p className="text-orange-100 text-xs">{data.description}</p>
    )}
    <div className="mt-2 text-xs bg-orange-400 bg-opacity-30 rounded px-2 py-1">
      {data.fieldCount || 0} 个表
    </div>
  </div>
);

// 表节点组件
const TableNode: React.FC<{ data: MindmapNodeData }> = ({ data }) => {
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false);
  
  return (
    <div className="mindmap-node table bg-bg-paper border-2 border-green-300 rounded-lg shadow-theme-md min-w-[180px]">
      {/* 表头 */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4" />
            <span className="font-medium text-sm">{data.label}</span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:text-green-200 transition-colors"
            title={isCollapsed ? '展开详情' : '折叠详情'}
          >
            {isCollapsed ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* 表内容 */}
      {!isCollapsed && (
        <div className="p-3">
          {data.description && (
            <p className="text-xs text-text-secondary mb-2">{data.description}</p>
          )}
          
          {/* 统计信息 */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">字段数:</span>
              <span className="font-medium text-text-primary">{data.fieldCount || 0}</span>
            </div>
            
            {data.primaryKeys && data.primaryKeys.length > 0 && (
              <div className="flex items-center gap-1 text-yellow-600">
                <Key className="w-3 h-3" />
                <span>主键: {data.primaryKeys.join(', ')}</span>
              </div>
            )}
            
            {data.foreignKeys && data.foreignKeys.length > 0 && (
              <div className="flex items-center gap-1 text-blue-600">
                <Hash className="w-3 h-3" />
                <span>外键: {data.foreignKeys.length}个</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 字段组节点组件
const FieldGroupNode: React.FC<{ data: MindmapNodeData }> = ({ data }) => (
  <div className="mindmap-node field-group bg-gradient-to-br from-purple-400 to-purple-500 text-white rounded-lg p-3 shadow-sm min-w-[120px]">
    <div className="flex items-center gap-2 mb-1">
      <Type className="w-4 h-4" />
      <span className="font-medium text-sm">{data.label}</span>
    </div>
    {data.description && (
      <p className="text-purple-100 text-xs">{data.description}</p>
    )}
  </div>
);

// 自定义节点类型
const nodeTypes: NodeTypes = {
  project: ProjectNode,
  category: CategoryNode,
  table: TableNode,
  fieldGroup: FieldGroupNode,
};

interface DataModelMindmapProps {
  projectId: string;
  className?: string;
  height?: string;
  showMinimap?: boolean;
  showBackground?: boolean;
  allowEditing?: boolean;
}

export const DataModelMindmap: React.FC<DataModelMindmapProps> = ({
  projectId,
  className = '',
  height = '600px',
  showMinimap = true,
  showBackground = true,
  allowEditing = false,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<'radial' | 'hierarchical' | 'force'>('radial');

  // 获取项目的数据表
  const { data: tables, isLoading, error } = useQuery({
    queryKey: ['project-tables-mindmap', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/database-tables`);
      return response.data;
    },
    enabled: !!projectId,
  });

  // 获取项目信息
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
  });

  // 转换数据为思维导图节点和边
  const transformToMindmapData = useCallback((tables: any[], project: any) => {
    if (!tables || !project) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 1. 创建项目根节点
    const projectNode: Node = {
      id: `project-${project.id}`,
      type: 'project',
      position: { x: 0, y: 0 },
      data: {
        label: project.name,
        description: project.description,
        type: 'project',
        entityId: project.id,
        entityType: 'project',
        level: 0,
        metadata: {
          tableCount: tables.length,
          relationCount: 0, // TODO: 获取关系数量
        }
      } as MindmapNodeData,
      draggable: allowEditing,
    };
    nodes.push(projectNode);

    // 2. 按类别分组表格
    const tablesByCategory = tables.reduce((acc: Record<string, any[]>, table) => {
      const category = table.category || '默认分类';
      if (!acc[category]) acc[category] = [];
      acc[category].push(table);
      return acc;
    }, {});

    // 3. 创建分类节点和表节点
    const categories = Object.keys(tablesByCategory);
    const angleStep = (2 * Math.PI) / categories.length;
    const categoryRadius = 300;

    categories.forEach((category, categoryIndex) => {
      const categoryAngle = categoryIndex * angleStep;
      const categoryX = Math.cos(categoryAngle) * categoryRadius;
      const categoryY = Math.sin(categoryAngle) * categoryRadius;

      // 创建分类节点
      const categoryNodeId = `category-${category}`;
      const categoryNode: Node = {
        id: categoryNodeId,
        type: 'category',
        position: { x: categoryX, y: categoryY },
        data: {
          label: category,
          type: 'category',
          entityId: category,
          entityType: 'category',
          level: 1,
          fieldCount: tablesByCategory[category].length,
        } as MindmapNodeData,
        draggable: allowEditing,
      };
      nodes.push(categoryNode);

      // 连接项目到分类
      edges.push({
        id: `project-${categoryNodeId}`,
        source: projectNode.id,
        target: categoryNodeId,
        type: 'smoothstep',
        style: { stroke: '#f59e0b', strokeWidth: 3 },
        className: 'mindmap-edge hierarchy',
      });

      // 4. 创建表节点
      const tablesInCategory = tablesByCategory[category];
      const tableAngleStep = Math.PI / Math.max(tablesInCategory.length - 1, 1);
      const tableRadius = 200;

      tablesInCategory.forEach((table, tableIndex) => {
        const tableAngle = categoryAngle + (tableIndex - (tablesInCategory.length - 1) / 2) * tableAngleStep * 0.5;
        const tableX = categoryX + Math.cos(tableAngle) * tableRadius;
        const tableY = categoryY + Math.sin(tableAngle) * tableRadius;

        const tableNode: Node = {
          id: `table-${table.id}`,
          type: 'table',
          position: { x: tableX, y: tableY },
          data: {
            label: table.name,
            description: table.description,
            type: 'table',
            entityId: table.id,
            entityType: 'table',
            level: 2,
            fieldCount: table.fields?.length || 0,
            primaryKeys: table.fields?.filter((f: any) => f.isPrimaryKey).map((f: any) => f.name) || [],
            foreignKeys: table.fields?.filter((f: any) => f.isForeignKey).map((f: any) => f.name) || [],
          } as MindmapNodeData,
          draggable: allowEditing,
        };
        nodes.push(tableNode);

        // 连接分类到表
        edges.push({
          id: `${categoryNodeId}-${tableNode.id}`,
          source: categoryNodeId,
          target: tableNode.id,
          type: 'smoothstep',
          style: { stroke: '#10b981', strokeWidth: 2 },
          className: 'mindmap-edge hierarchy',
        });

        // 5. 创建外键关系边
        if (table.fields) {
          table.fields.forEach((field: any) => {
            if (field.isForeignKey && field.foreignKeyReference) {
              const targetTableId = `table-${field.foreignKeyReference.tableId}`;
              if (nodes.some(n => n.id === targetTableId)) {
                edges.push({
                  id: `fk-${table.id}-${field.foreignKeyReference.tableId}`,
                  source: tableNode.id,
                  target: targetTableId,
                  type: 'smoothstep',
                  style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 2, 
                    strokeDasharray: '5,5' 
                  },
                  className: 'mindmap-edge foreign-key',
                  label: field.name,
                });
              }
            }
          });
        }
      });
    });

    return { nodes, edges };
  }, [allowEditing]);

  // 应用布局算法
  const applyLayout = useCallback((layout: string) => {
    if (!tables || !project) return;

    let { nodes: newNodes, edges: newEdges } = transformToMindmapData(tables, project);

    // 根据选择的布局调整节点位置
    switch (layout) {
      case 'hierarchical':
        // 层次布局
        newNodes = newNodes.map((node, index) => {
          const level = (node.data as MindmapNodeData).level || 0;
          return {
            ...node,
            position: {
              x: (index % 5) * 300 - 600,
              y: level * 250,
            },
          };
        });
        break;
      case 'force':
        // 力导向布局（简化版）
        newNodes = newNodes.map((node, index) => {
          const angle = (index / newNodes.length) * 2 * Math.PI;
          const radius = 100 + (index % 3) * 100;
          return {
            ...node,
            position: {
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
            },
          };
        });
        break;
      // 'radial' 是默认布局，已在 transformToMindmapData 中实现
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [tables, project, transformToMindmapData, setNodes, setEdges]);

  // 初始化数据
  useEffect(() => {
    if (tables && project) {
      applyLayout(selectedLayout);
    }
  }, [tables, project, selectedLayout, applyLayout]);

  // 导出为图片
  const exportAsImage = useCallback(async () => {
    setIsExporting(true);
    try {
      const element = document.querySelector('.data-model-mindmap .react-flow') as HTMLElement;
      if (element) {
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        });
        
        const link = document.createElement('a');
        link.download = `data-model-mindmap-${projectId}-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        toast.success('思维导图已导出');
      }
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="text-red-500 mb-2">加载数据失败</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!tables || tables.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-gray-500">
          <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>暂无数据表信息</p>
          <p className="text-sm mt-2">请先导入数据模型文档</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`data-model-mindmap relative ${className}`} style={{ height }}>
      {/* 工具栏 */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-2">
        {/* 布局选择 */}
        <select
          value={selectedLayout}
          onChange={(e) => setSelectedLayout(e.target.value as any)}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="radial">辐射布局</option>
          <option value="hierarchical">层次布局</option>
          <option value="force">力导向布局</option>
        </select>

        {/* 应用布局按钮 */}
        <button
          onClick={() => applyLayout(selectedLayout)}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="应用布局"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* 导出按钮 */}
        <button
          onClick={exportAsImage}
          disabled={isExporting}
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
          title="导出为图片"
        >
          {isExporting ? (
            <div className="w-4 h-4 animate-spin border-2 border-gray-300 border-t-green-600 rounded-full" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>

        {/* 统计信息 */}
        <div className="ml-2 text-xs text-gray-500 border-l pl-2">
          {nodes.length} 节点, {edges.length} 连接
        </div>
      </div>

      {/* ReactFlow 组件 */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        className="mindmap-viewer"
      >
        {/* 控制面板 */}
        <Controls
          showInteractive={false}
          className="bg-white border border-gray-200 rounded-lg shadow-lg"
        />

        {/* 背景 */}
        {showBackground && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={30}
            size={1}
            color="#e5e7eb"
          />
        )}

        {/* 小地图 */}
        {showMinimap && (
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor={(node) => {
              const nodeData = node.data as MindmapNodeData;
              switch (nodeData.type) {
                case 'project': return '#3b82f6';
                case 'category': return '#f59e0b';
                case 'table': return '#10b981';
                case 'field-group': return '#8b5cf6';
                default: return '#6b7280';
              }
            }}
            className="bg-white border border-gray-200 rounded-lg"
          />
        )}
      </ReactFlow>
    </div>
  );
};

export default DataModelMindmap;