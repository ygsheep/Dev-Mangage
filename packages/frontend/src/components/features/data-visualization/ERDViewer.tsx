import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  ConnectionMode,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
  BackgroundVariant,
} from 'reactflow';
import { 
  Database, 
  Key, 
  Hash, 
  Type, 
  Calendar, 
  FileText, 
  ToggleLeft,
  Settings,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';

// 数据类型定义
interface DatabaseField {
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  defaultValue?: string;
  description?: string;
  foreignKeyReference?: {
    tableId: string;
    tableName: string;
    fieldId: string;
    fieldName: string;
  };
}

interface DatabaseTable {
  id: string;
  name: string;
  description?: string;
  fields: DatabaseField[];
  indexes: Array<{
    id: string;
    name: string;
    fields: string[];
    isUnique: boolean;
  }>;
  position?: { x: number; y: number };
}

interface ERDViewerProps {
  projectId: string;
  className?: string;
  height?: string;
  showMinimap?: boolean;
  showBackground?: boolean;
  allowEditing?: boolean;
}

// 自定义表格节点组件
const TableNode: React.FC<{ data: DatabaseTable }> = ({ data }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className="bg-bg-paper border-2 border-gray-300 rounded-lg shadow-lg min-w-[250px]">
      {/* 表头 */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span className="font-semibold text-sm">{data.name}</span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:text-blue-200 transition-colors"
            title={isCollapsed ? '展开字段' : '折叠字段'}
          >
            {isCollapsed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
        {data.description && (
          <p className="text-xs text-blue-100 mt-1 opacity-90">
            {data.description}
          </p>
        )}
      </div>

      {/* 字段列表 */}
      {!isCollapsed && (
        <div className="border-t border-gray-200">
          {data.fields.map((field, index) => (
            <div
              key={field.id}
              className={`px-4 py-2 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 ${
                index === data.fields.length - 1 ? 'border-b-0' : ''
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                {/* 字段图标 */}
                <div className="flex items-center gap-1">
                  {field.isPrimaryKey && (
                    <Key className="w-3 h-3 text-yellow-500" title="主键" />
                  )}
                  {field.isForeignKey && (
                    <Hash className="w-3 h-3 text-blue-500" title="外键" />
                  )}
                  {!field.isPrimaryKey && !field.isForeignKey && (
                    <Type className="w-3 h-3 text-gray-400" />
                  )}
                </div>
                
                {/* 字段名和类型 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      field.isPrimaryKey ? 'text-yellow-700' : 
                      field.isForeignKey ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {field.name}
                    </span>
                    {field.isRequired && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {field.type}
                    {field.defaultValue && (
                      <span className="ml-1">= {field.defaultValue}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 连接点 */}
              <div className="flex gap-1">
                {/* 输入连接点（用于接收外键连接） */}
                <div
                  className="w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    position: 'absolute',
                    left: '-4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                
                {/* 输出连接点（用于外键引用） */}
                {field.isForeignKey && (
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full"
                    style={{
                      position: 'absolute',
                      right: '-4px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 索引信息 */}
      {!isCollapsed && data.indexes.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
          <div className="text-xs text-gray-600 mb-1">索引:</div>
          {data.indexes.map((index) => (
            <div key={index.id} className="text-xs text-gray-500 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              <span className={index.isUnique ? 'font-medium' : ''}>
                {index.name} ({index.fields.join(', ')})
                {index.isUnique && ' - 唯一'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 自定义节点类型
const nodeTypes = {
  tableNode: TableNode,
};

export const ERDViewer: React.FC<ERDViewerProps> = ({
  projectId,
  className = '',
  height = '600px',
  showMinimap = true,
  showBackground = true,
  allowEditing = false,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedLayout, setSelectedLayout] = useState<'auto' | 'horizontal' | 'vertical' | 'circular'>('auto');
  const [isExporting, setIsExporting] = useState(false);

  // 获取项目的数据模型
  const { data: tables, isLoading, error } = useQuery({
    queryKey: ['project-tables', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/database-tables`);
      return response.data as DatabaseTable[];
    },
    enabled: !!projectId,
  });

  // 自动布局算法
  const calculateLayout = useCallback((tables: DatabaseTable[], layout: string) => {
    if (!tables.length) return { nodes: [], edges: [] };

    const nodeSpacing = { x: 300, y: 250 };
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 根据布局类型计算位置
    tables.forEach((table, index) => {
      let position = { x: 0, y: 0 };

      switch (layout) {
        case 'horizontal':
          position = {
            x: index * nodeSpacing.x,
            y: Math.floor(index / 4) * nodeSpacing.y,
          };
          break;
        case 'vertical':
          position = {
            x: Math.floor(index / 4) * nodeSpacing.x,
            y: index * nodeSpacing.y,
          };
          break;
        case 'circular':
          const angle = (index / tables.length) * 2 * Math.PI;
          const radius = Math.max(200, tables.length * 50);
          position = {
            x: Math.cos(angle) * radius + radius,
            y: Math.sin(angle) * radius + radius,
          };
          break;
        default: // auto
          const cols = Math.ceil(Math.sqrt(tables.length));
          position = {
            x: (index % cols) * nodeSpacing.x,
            y: Math.floor(index / cols) * nodeSpacing.y,
          };
      }

      // 使用保存的位置或计算的位置
      const finalPosition = table.position || position;

      nodes.push({
        id: table.id,
        type: 'tableNode',
        position: finalPosition,
        data: table,
        draggable: allowEditing,
      });
    });

    // 创建关系边
    tables.forEach((table) => {
      table.fields.forEach((field) => {
        if (field.isForeignKey && field.foreignKeyReference) {
          const targetTable = tables.find(t => t.id === field.foreignKeyReference!.tableId);
          if (targetTable) {
            edges.push({
              id: `${table.id}-${field.id}-${field.foreignKeyReference.tableId}-${field.foreignKeyReference.fieldId}`,
              source: table.id,
              target: field.foreignKeyReference.tableId,
              sourceHandle: field.id,
              targetHandle: field.foreignKeyReference.fieldId,
              label: `${field.name} → ${field.foreignKeyReference.fieldName}`,
              type: 'smoothstep',
              style: {
                stroke: '#3b82f6',
                strokeWidth: 2,
              },
              markerEnd: {
                type: 'arrowclosed',
                color: '#3b82f6',
              },
            });
          }
        }
      });
    });

    return { nodes, edges };
  }, [allowEditing]);

  // 当数据加载完成时，初始化节点和边
  useEffect(() => {
    if (tables) {
      const { nodes: newNodes, edges: newEdges } = calculateLayout(tables, selectedLayout);
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [tables, selectedLayout, calculateLayout, setNodes, setEdges]);

  // 处理连接创建
  const onConnect = useCallback(
    (params: Connection) => {
      if (!allowEditing) return;
      
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            style: { stroke: '#3b82f6', strokeWidth: 2 },
            markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
          },
          eds
        )
      );
    },
    [allowEditing, setEdges]
  );

  // 导出为图片
  const exportAsImage = useCallback(async () => {
    setIsExporting(true);
    try {
      const element = document.querySelector('.react-flow') as HTMLElement;
      if (element) {
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        });
        
        const link = document.createElement('a');
        link.download = `erd-${projectId}-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        toast.success('ERD图表已导出');
      }
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  }, [projectId]);

  // 自动布局
  const applyAutoLayout = useCallback(() => {
    if (tables) {
      const { nodes: newNodes, edges: newEdges } = calculateLayout(tables, selectedLayout);
      setNodes(newNodes);
      setEdges(newEdges);
      toast.success('布局已更新');
    }
  }, [tables, selectedLayout, calculateLayout, setNodes, setEdges]);

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
          <div className="text-red-500 mb-2">加载ERD数据失败</div>
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
    <div className={`relative ${className}`} style={{ height }}>
      {/* 工具栏 */}
      <div className="absolute top-4 left-4 z-10 bg-bg-paper rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-2">
        {/* 布局选择 */}
        <select
          value={selectedLayout}
          onChange={(e) => setSelectedLayout(e.target.value as any)}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="auto">自动布局</option>
          <option value="horizontal">水平布局</option>
          <option value="vertical">垂直布局</option>
          <option value="circular">环形布局</option>
        </select>

        {/* 应用布局按钮 */}
        <button
          onClick={applyAutoLayout}
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
          {tables.length} 表, {edges.length} 关系
        </div>
      </div>

      {/* ReactFlow 组件 */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-gray-50"
      >
        {/* 控制面板 */}
        <Controls
          showInteractive={false}
          className="bg-bg-paper border border-gray-200 rounded-lg shadow-lg"
        />

        {/* 背景 */}
        {showBackground && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#e5e7eb"
          />
        )}

        {/* 小地图 */}
        {showMinimap && (
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor={(node) => {
              return '#3b82f6';
            }}
            className="bg-bg-paper border border-gray-200 rounded-lg"
          />
        )}
      </ReactFlow>
    </div>
  );
};

export default ERDViewer;