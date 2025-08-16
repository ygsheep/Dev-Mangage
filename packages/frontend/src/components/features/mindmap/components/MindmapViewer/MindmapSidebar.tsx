// packages/frontend/src/components/MindmapViewer/MindmapSidebar.tsx

import React, { useState, useEffect } from 'react'
import { X, Edit3, Save, RotateCcw, Eye, Settings, Trash2 } from 'lucide-react'
import { MindmapNodeData, MindmapEdgeData, MindmapNodeType, MindmapEdgeType } from '../../../../../types/mindmap'
import { useMindmapStore } from '../../../../../stores/mindmapStore'

interface MindmapSidebarProps {
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  onNodeUpdate: (nodeId: string, updates: Partial<MindmapNodeData>) => void
  onEdgeUpdate: (edgeId: string, updates: Partial<MindmapEdgeData>) => void
  className?: string
}

const MindmapSidebar: React.FC<MindmapSidebarProps> = ({
  selectedNodeIds,
  selectedEdgeIds,
  onNodeUpdate,
  onEdgeUpdate,
  className = ''
}) => {
  const { nodes, edges } = useMindmapStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})

  // 获取选中的节点和边
  const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id))
  const selectedEdges = edges.filter(edge => selectedEdgeIds.includes(edge.id))
  const selectedNode = selectedNodes[0]
  const selectedEdge = selectedEdges[0]

  // 当选择变化时重置编辑状态
  useEffect(() => {
    setIsEditing(false)
    setEditData({})
  }, [selectedNodeIds, selectedEdgeIds])

  // 开始编辑
  const handleStartEdit = () => {
    if (selectedNode) {
      setEditData({ ...selectedNode.data })
    } else if (selectedEdge) {
      setEditData({ ...selectedEdge.data })
    }
    setIsEditing(true)
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (selectedNode && isEditing) {
      onNodeUpdate(selectedNode.id, editData)
    } else if (selectedEdge && isEditing) {
      onEdgeUpdate(selectedEdge.id, editData)
    }
    setIsEditing(false)
    setEditData({})
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditData({})
  }

  // 如果没有选中任何内容，显示帮助信息
  if (selectedNodes.length === 0 && selectedEdges.length === 0) {
    return (
      <div className={`w-80 bg-white border-l border-gray-200 p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">选择节点或关系</h3>
          <p className="text-xs text-gray-500">
            点击图中的节点或连线查看详细信息
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-80 bg-white border-l border-gray-200 overflow-y-auto ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedNode ? '节点属性' : selectedEdge ? '关系属性' : '属性面板'}
          </h3>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={handleStartEdit}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                title="编辑"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="p-2 text-green-600 hover:text-green-700 rounded-md hover:bg-green-50 transition-colors"
                  title="保存"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                  title="取消"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 节点信息 */}
        {selectedNode && (
          <>
            {/* 基础信息 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">基础信息</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    节点名称
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.label || ''}
                      onChange={(e) => setEditData({...editData, label: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{selectedNode.data.label}</div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editData.description || ''}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-sm text-gray-600">
                      {selectedNode.data.description || '暂无描述'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    节点类型
                  </label>
                  <div className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                    {selectedNode.data.type}
                  </div>
                </div>

                {selectedNode.data.category && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      分类
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedNode.data.category}
                    </div>
                  </div>
                )}

                {selectedNode.data.status && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      状态
                    </label>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      selectedNode.data.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      selectedNode.data.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedNode.data.status === 'DRAFT' ? '草稿' : 
                       selectedNode.data.status === 'ACTIVE' ? '已创建' : '已废弃'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 统计信息 */}
            {selectedNode.data.type === MindmapNodeType.TABLE && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">统计信息</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="text-lg font-semibold text-blue-600">
                      {selectedNode.data.fieldCount || 0}
                    </div>
                    <div className="text-xs text-blue-600">字段数量</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md">
                    <div className="text-lg font-semibold text-green-600">
                      {selectedNode.data.indexCount || 0}
                    </div>
                    <div className="text-xs text-green-600">索引数量</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-md">
                    <div className="text-lg font-semibold text-purple-600">
                      {selectedNode.data.relationshipCount || 0}
                    </div>
                    <div className="text-xs text-purple-600">关联数量</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-md">
                    <div className="text-lg font-semibold text-orange-600">
                      {selectedNode.data.level || 0}
                    </div>
                    <div className="text-xs text-orange-600">层级深度</div>
                  </div>
                </div>
              </div>
            )}

            {/* 扩展信息 */}
            {selectedNode.data.metadata && Object.keys(selectedNode.data.metadata).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">扩展信息</h4>
                <div className="space-y-2">
                  {Object.entries(selectedNode.data.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 capitalize">{key}:</span>
                      <span className="text-xs text-gray-900 font-mono">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">操作</h4>
              <div className="space-y-2">
                {selectedNode.data.entityType === 'table' && (
                  <button
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                    onClick={() => {
                      // 跳转到表详情页
                      window.open(`/tables/${selectedNode.data.entityId}`, '_blank')
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    <span>查看表详情</span>
                  </button>
                )}

                <button
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    console.log('Configure node:', selectedNode.id)
                  }}
                >
                  <Settings className="w-4 h-4" />
                  <span>节点设置</span>
                </button>

                <button
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                  onClick={() => {
                    if (confirm('确定要删除这个节点吗？')) {
                      console.log('Delete node:', selectedNode.id)
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除节点</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* 边信息 */}
        {selectedEdge && (
          <>
            {/* 关系基础信息 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">关系信息</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    关系名称
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.label || ''}
                      onChange={(e) => setEditData({...editData, label: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">
                      {selectedEdge.data.label || '未命名关系'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    关系类型
                  </label>
                  <div className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                    {selectedEdge.data.type}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    源节点
                  </label>
                  <div className="text-sm text-gray-900">{selectedEdge.source}</div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    目标节点
                  </label>
                  <div className="text-sm text-gray-900">{selectedEdge.target}</div>
                </div>

                {selectedEdge.data.constraintType && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      约束类型
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedEdge.data.constraintType}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 样式设置 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">样式设置</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    线条样式
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.style || 'solid'}
                      onChange={(e) => setEditData({...editData, style: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="solid">实线</option>
                      <option value="dashed">虚线</option>
                      <option value="dotted">点线</option>
                    </select>
                  ) : (
                    <div className="text-sm text-gray-900">
                      {selectedEdge.data.style === 'solid' ? '实线' :
                       selectedEdge.data.style === 'dashed' ? '虚线' : '点线'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    颜色
                  </label>
                  {isEditing ? (
                    <input
                      type="color"
                      value={editData.color || '#9CA3AF'}
                      onChange={(e) => setEditData({...editData, color: e.target.value})}
                      className="w-full h-10 rounded-md border border-gray-300"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: selectedEdge.data.color }}
                      />
                      <span className="text-sm text-gray-900 font-mono">
                        {selectedEdge.data.color}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isEditing ? editData.animated : selectedEdge.data.animated}
                      onChange={(e) => isEditing && setEditData({...editData, animated: e.target.checked})}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-700">动画效果</span>
                  </label>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MindmapSidebar