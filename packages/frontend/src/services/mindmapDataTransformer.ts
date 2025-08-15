// packages/frontend/src/services/mindmapDataTransformer.ts

import { DatabaseTable, TableRelationship } from '@shared/types'
import { 
  MindmapNode, 
  MindmapEdge, 
  MindmapNodeData, 
  MindmapNodeType, 
  MindmapEdgeType, 
  MindmapChangeSet 
} from '../types/mindmap'

class MindmapDataTransformer {
  /**
   * 从数据库表数据转换为mindmap数据
   */
  fromDatabaseTables(
    tables: DatabaseTable[], 
    relationships: TableRelationship[]
  ): { nodes: MindmapNode[], edges: MindmapEdge[] } {
    const nodes: MindmapNode[] = []
    const edges: MindmapEdge[] = []

    // 1. 创建项目根节点（假设从第一个表获取项目信息）
    if (tables.length > 0) {
      const projectNode: MindmapNode = {
        id: `project-${tables[0].projectId}`,
        type: 'project',
        position: { x: 0, y: 0 },
        data: {
          id: `project-${tables[0].projectId}`,
          type: MindmapNodeType.PROJECT,
          label: '项目根节点',
          description: '数据模型总览',
          entityId: tables[0].projectId,
          entityType: 'project',
          level: 0,
          metadata: {
            tableCount: tables.length,
            relationCount: relationships.length,
            tagCount: new Set(tables.map(t => t.category).filter(Boolean)).size
          }
        }
      }
      nodes.push(projectNode)
    }

    // 2. 按分类分组表
    const tablesByCategory = this.groupTablesByCategory(tables)
    let categoryYOffset = 200

    // 3. 创建分类节点
    Object.entries(tablesByCategory).forEach(([category, categoryTables]) => {
      const categoryId = `category-${category}`
      
      const categoryNode: MindmapNode = {
        id: categoryId,
        type: 'category',
        position: { x: -200, y: categoryYOffset },
        data: {
          id: categoryId,
          type: MindmapNodeType.CATEGORY,
          label: category || '未分类',
          description: `${categoryTables.length}个数据表`,
          category,
          level: 1,
          metadata: {
            childCount: categoryTables.length,
            fieldCount: categoryTables.reduce((sum, t) => sum + (t.fields?.length || 0), 0)
          }
        }
      }
      nodes.push(categoryNode)

      // 创建项目到分类的连接
      if (tables.length > 0) {
        edges.push(this.createHierarchyEdge(
          `project-${tables[0].projectId}`,
          categoryId
        ))
      }

      // 4. 创建表节点
      let tableXOffset = 100
      categoryTables.forEach((table, index) => {
        const tableNode: MindmapNode = {
          id: `table-${table.id}`,
          type: 'table',
          position: { 
            x: tableXOffset + (index % 3) * 280, 
            y: categoryYOffset + Math.floor(index / 3) * 180 
          },
          data: {
            id: `table-${table.id}`,
            type: MindmapNodeType.TABLE,
            label: table.displayName || table.name,
            description: table.comment,
            entityId: table.id,
            entityType: 'table',
            status: table.status,
            category: table.category,
            fieldCount: table.fields?.length || 0,
            indexCount: table.indexes?.length || 0,
            relationshipCount: (table.fromRelations?.length || 0) + (table.toRelations?.length || 0),
            level: 2,
            color: this.getTableColor(table.status),
            size: this.getTableSize(table.fields?.length || 0),
            metadata: {
              engine: table.engine,
              charset: table.charset,
              createdAt: table.createdAt
            }
          }
        }
        nodes.push(tableNode)

        // 创建分类到表的连接
        edges.push(this.createHierarchyEdge(categoryId, `table-${table.id}`))
      })

      categoryYOffset += Math.ceil(categoryTables.length / 3) * 200 + 100
    })

    // 5. 创建表间关系连接
    relationships.forEach(relationship => {
      const fromNodeId = `table-${relationship.fromTableId}`
      const toNodeId = `table-${relationship.toTableId}`
      
      // 确保两个节点都存在
      const fromExists = nodes.some(n => n.id === fromNodeId)
      const toExists = nodes.some(n => n.id === toNodeId)
      
      if (fromExists && toExists) {
        edges.push(this.createRelationshipEdge(relationship))
      }
    })

    return { nodes, edges }
  }

  /**
   * 按分类分组表
   */
  private groupTablesByCategory(tables: DatabaseTable[]): Record<string, DatabaseTable[]> {
    return tables.reduce((groups, table) => {
      const category = table.category || '未分类'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(table)
      return groups
    }, {} as Record<string, DatabaseTable[]>)
  }

  /**
   * 根据表状态获取颜色
   */
  private getTableColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return '#10B981'  // green-500
      case 'DRAFT': return '#F59E0B'   // amber-500
      case 'DEPRECATED': return '#EF4444' // red-500
      default: return '#6B7280'        // gray-500
    }
  }

  /**
   * 根据字段数量确定表节点大小
   */
  private getTableSize(fieldCount: number): 'small' | 'medium' | 'large' {
    if (fieldCount > 20) return 'large'
    if (fieldCount > 10) return 'medium'
    return 'small'
  }

  /**
   * 创建层次关系边
   */
  private createHierarchyEdge(source: string, target: string): MindmapEdge {
    return {
      id: `hierarchy-${source}-${target}`,
      source,
      target,
      type: 'hierarchy',
      data: {
        id: `hierarchy-${source}-${target}`,
        type: MindmapEdgeType.HIERARCHY,
        style: 'solid',
        color: '#9CA3AF',
        width: 2
      }
    }
  }

  /**
   * 创建表关系边
   */
  private createRelationshipEdge(relationship: TableRelationship): MindmapEdge {
    const edgeType = this.getEdgeType(relationship.relationshipType)
    
    return {
      id: `relationship-${relationship.id}`,
      source: `table-${relationship.fromTableId}`,
      target: `table-${relationship.toTableId}`,
      type: edgeType,
      data: {
        id: `relationship-${relationship.id}`,
        type: MindmapEdgeType.FOREIGN_KEY,
        label: relationship.name,
        relationshipId: relationship.id,
        fromField: relationship.fromFieldId,
        toField: relationship.toFieldId,
        constraintType: relationship.onDelete as any,
        style: this.getEdgeStyle(relationship.relationshipType),
        color: this.getEdgeColor(relationship.relationshipType),
        width: 2,
        animated: relationship.relationshipType === 'ONE_TO_MANY'
      }
    }
  }

  /**
   * 根据关系类型获取边类型
   */
  private getEdgeType(relationshipType: string): string {
    switch (relationshipType) {
      case 'ONE_TO_ONE': return 'reference'
      case 'ONE_TO_MANY': return 'foreignKey'
      case 'MANY_TO_MANY': return 'reference'
      default: return 'reference'
    }
  }

  /**
   * 根据关系类型获取边样式
   */
  private getEdgeStyle(relationshipType: string): 'solid' | 'dashed' | 'dotted' {
    switch (relationshipType) {
      case 'ONE_TO_ONE': return 'solid'
      case 'ONE_TO_MANY': return 'solid'
      case 'MANY_TO_MANY': return 'dashed'
      default: return 'dotted'
    }
  }

  /**
   * 根据关系类型获取边颜色
   */
  private getEdgeColor(relationshipType: string): string {
    switch (relationshipType) {
      case 'ONE_TO_ONE': return '#3B82F6'    // blue-500
      case 'ONE_TO_MANY': return '#10B981'   // green-500
      case 'MANY_TO_MANY': return '#F59E0B'  // amber-500
      default: return '#6B7280'              // gray-500
    }
  }

  /**
   * 提取mindmap变更
   */
  extractChanges(
    originalNodes: MindmapNode[],
    modifiedNodes: MindmapNode[]
  ): MindmapChangeSet {
    const originalMap = new Map(originalNodes.map(n => [n.id, n]))
    const modifiedMap = new Map(modifiedNodes.map(n => [n.id, n]))

    const changes: MindmapChangeSet = {
      nodeChanges: {
        added: [],
        updated: [],
        removed: []
      },
      edgeChanges: {
        added: [],
        updated: [],
        removed: []
      }
    }

    // 检查新增和修改的节点
    modifiedNodes.forEach(node => {
      const original = originalMap.get(node.id)
      if (!original) {
        changes.nodeChanges.added.push(node)
      } else if (JSON.stringify(original) !== JSON.stringify(node)) {
        changes.nodeChanges.updated.push({
          id: node.id,
          changes: this.diffNodeData(original.data, node.data)
        })
      }
    })

    // 检查删除的节点
    originalNodes.forEach(node => {
      if (!modifiedMap.has(node.id)) {
        changes.nodeChanges.removed.push(node.id)
      }
    })

    return changes
  }

  /**
   * 比较节点数据差异
   */
  private diffNodeData(original: MindmapNodeData, modified: MindmapNodeData): Partial<MindmapNodeData> {
    const changes: Partial<MindmapNodeData> = {}
    
    Object.keys(modified).forEach(key => {
      const originalValue = (original as any)[key]
      const modifiedValue = (modified as any)[key]
      
      if (JSON.stringify(originalValue) !== JSON.stringify(modifiedValue)) {
        (changes as any)[key] = modifiedValue
      }
    })

    return changes
  }

  /**
   * 转换为Mermaid格式
   */
  toMermaid(nodes: MindmapNode[], edges: MindmapEdge[]): string {
    let mermaid = 'graph TD\n'
    
    // 添加节点定义
    nodes.forEach(node => {
      const label = node.data.label.replace(/"/g, '\\"')
      let shape = ''
      
      switch (node.data.type) {
        case MindmapNodeType.PROJECT:
          shape = `[["${label}"]]`
          break
        case MindmapNodeType.CATEGORY:
          shape = `["${label}"]`
          break
        case MindmapNodeType.TABLE:
          shape = `("${label}")`
          break
        default:
          shape = `"${label}"`
      }
      
      mermaid += `    ${node.id.replace(/[^a-zA-Z0-9]/g, '_')}${shape}\n`
    })

    mermaid += '\n'

    // 添加边定义
    edges.forEach(edge => {
      const sourceId = edge.source.replace(/[^a-zA-Z0-9]/g, '_')
      const targetId = edge.target.replace(/[^a-zA-Z0-9]/g, '_')
      
      let connector = '-->'
      if (edge.data.style === 'dashed') {
        connector = '-.->'
      } else if (edge.data.animated) {
        connector = '==>'
      }

      const label = edge.data.label ? `|"${edge.data.label}"|` : ''
      mermaid += `    ${sourceId} ${connector}${label} ${targetId}\n`
    })

    return mermaid
  }

  /**
   * 从JSON数据导入
   */
  fromJSON(data: { nodes: any[], edges: any[] }): { nodes: MindmapNode[], edges: MindmapEdge[] } {
    return {
      nodes: data.nodes.map(node => ({
        ...node,
        data: { ...node.data }
      })) as MindmapNode[],
      edges: data.edges.map(edge => ({
        ...edge,
        data: { ...edge.data }
      })) as MindmapEdge[]
    }
  }

  /**
   * 导出为JSON格式
   */
  toJSON(nodes: MindmapNode[], edges: MindmapEdge[]): string {
    return JSON.stringify({
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: edge.data
      }))
    }, null, 2)
  }
}

export const mindmapDataTransformer = new MindmapDataTransformer()