// packages/frontend/src/services/mindmapLayoutService.ts

import { MindmapNode, MindmapEdge, MindmapConfig, LayoutAlgorithm } from '../types/mindmap'

/**
 * 层次布局算法
 */
class HierarchicalLayout implements LayoutAlgorithm {
  name = 'hierarchical'

  calculate(
    nodes: MindmapNode[], 
    edges: MindmapEdge[], 
    config: MindmapConfig
  ): { nodes: MindmapNode[], edges: MindmapEdge[] } {
    const { direction, spacing } = config.layout
    const isVertical = direction === 'TB' || direction === 'BT'
    const isReverse = direction === 'BT' || direction === 'RL'

    // 按层级分组节点
    const nodesByLevel = this.groupNodesByLevel(nodes, edges)
    const levelKeys = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b)
    
    let currentOffset = 0
    const positionedNodes: MindmapNode[] = []

    levelKeys.forEach(level => {
      const levelNodes = nodesByLevel[level]
      const totalWidth = levelNodes.length * spacing.node
      let startOffset = -totalWidth / 2

      levelNodes.forEach((node, index) => {
        const position = isVertical ? {
          x: startOffset + index * spacing.node,
          y: isReverse ? -currentOffset : currentOffset
        } : {
          x: isReverse ? -currentOffset : currentOffset,
          y: startOffset + index * spacing.node
        }

        positionedNodes.push({
          ...node,
          position
        })
      })

      currentOffset += spacing.level
    })

    return { nodes: positionedNodes, edges }
  }

  private groupNodesByLevel(nodes: MindmapNode[], edges: MindmapEdge[]): Record<number, MindmapNode[]> {
    const nodesByLevel: Record<number, MindmapNode[]> = {}
    
    nodes.forEach(node => {
      const level = node.data.level || 0
      if (!nodesByLevel[level]) {
        nodesByLevel[level] = []
      }
      nodesByLevel[level].push(node)
    })

    return nodesByLevel
  }
}

/**
 * 放射布局算法
 */
class RadialLayout implements LayoutAlgorithm {
  name = 'radial'

  calculate(
    nodes: MindmapNode[], 
    edges: MindmapEdge[], 
    config: MindmapConfig
  ): { nodes: MindmapNode[], edges: MindmapEdge[] } {
    const { spacing } = config.layout
    
    // 找到根节点（项目节点）
    const rootNode = nodes.find(n => n.data.level === 0)
    if (!rootNode) {
      return { nodes, edges }
    }

    // 将根节点放在中心
    const positionedNodes: MindmapNode[] = [
      { ...rootNode, position: { x: 0, y: 0 } }
    ]

    // 按层级分组其他节点
    const nodesByLevel = this.groupByLevel(nodes.filter(n => n.data.level !== 0))
    
    Object.entries(nodesByLevel).forEach(([levelStr, levelNodes]) => {
      const level = parseInt(levelStr)
      const radius = level * spacing.level
      const angleStep = (2 * Math.PI) / levelNodes.length

      levelNodes.forEach((node, index) => {
        const angle = index * angleStep
        const position = {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle)
        }

        positionedNodes.push({
          ...node,
          position
        })
      })
    })

    return { nodes: positionedNodes, edges }
  }

  private groupByLevel(nodes: MindmapNode[]): Record<number, MindmapNode[]> {
    return nodes.reduce((acc, node) => {
      const level = node.data.level || 1
      if (!acc[level]) acc[level] = []
      acc[level].push(node)
      return acc
    }, {} as Record<number, MindmapNode[]>)
  }
}

/**
 * 力导向布局算法
 */
class ForceLayout implements LayoutAlgorithm {
  name = 'force'

  calculate(
    nodes: MindmapNode[], 
    edges: MindmapEdge[], 
    config: MindmapConfig
  ): { nodes: MindmapNode[], edges: MindmapEdge[] } {
    const { spacing } = config.layout
    const iterations = 100
    const repulsionStrength = 1000
    const attractionStrength = 0.01

    // 初始化随机位置
    let positionedNodes = nodes.map(node => ({
      ...node,
      position: {
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400
      }
    }))

    // 力导向迭代
    for (let i = 0; i < iterations; i++) {
      const forces = new Map<string, { x: number, y: number }>()

      // 初始化力
      positionedNodes.forEach(node => {
        forces.set(node.id, { x: 0, y: 0 })
      })

      // 计算斥力
      for (let j = 0; j < positionedNodes.length; j++) {
        for (let k = j + 1; k < positionedNodes.length; k++) {
          const nodeA = positionedNodes[j]
          const nodeB = positionedNodes[k]
          
          const dx = nodeA.position.x - nodeB.position.x
          const dy = nodeA.position.y - nodeB.position.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1

          const force = repulsionStrength / (distance * distance)
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force

          const forceA = forces.get(nodeA.id)!
          const forceB = forces.get(nodeB.id)!
          
          forceA.x += fx
          forceA.y += fy
          forceB.x -= fx
          forceB.y -= fy
        }
      }

      // 计算引力（基于边连接）
      edges.forEach(edge => {
        const sourceNode = positionedNodes.find(n => n.id === edge.source)
        const targetNode = positionedNodes.find(n => n.id === edge.target)
        
        if (sourceNode && targetNode) {
          const dx = targetNode.position.x - sourceNode.position.x
          const dy = targetNode.position.y - sourceNode.position.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1

          const force = distance * attractionStrength
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force

          const sourceForce = forces.get(sourceNode.id)!
          const targetForce = forces.get(targetNode.id)!
          
          sourceForce.x += fx
          sourceForce.y += fy
          targetForce.x -= fx
          targetForce.y -= fy
        }
      })

      // 应用力并更新位置
      positionedNodes = positionedNodes.map(node => {
        const force = forces.get(node.id)!
        return {
          ...node,
          position: {
            x: node.position.x + force.x * 0.01,
            y: node.position.y + force.y * 0.01
          }
        }
      })
    }

    return { nodes: positionedNodes, edges }
  }
}

/**
 * 环形布局算法
 */
class CircularLayout implements LayoutAlgorithm {
  name = 'circular'

  calculate(
    nodes: MindmapNode[], 
    edges: MindmapEdge[], 
    config: MindmapConfig
  ): { nodes: MindmapNode[], edges: MindmapEdge[] } {
    const { spacing } = config.layout
    const radius = Math.max(200, nodes.length * spacing.node / (2 * Math.PI))
    
    const positionedNodes = nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length
      return {
        ...node,
        position: {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle)
        }
      }
    })

    return { nodes: positionedNodes, edges }
  }
}

/**
 * Mindmap布局服务
 */
class MindmapLayoutService {
  private algorithms: Map<string, LayoutAlgorithm>

  constructor() {
    this.algorithms = new Map([
      ['hierarchical', new HierarchicalLayout()],
      ['radial', new RadialLayout()],
      ['force', new ForceLayout()],
      ['circular', new CircularLayout()]
    ])
  }

  /**
   * 计算布局
   */
  async calculate(
    nodes: MindmapNode[],
    edges: MindmapEdge[],
    config: MindmapConfig
  ): Promise<{ nodes: MindmapNode[], edges: MindmapEdge[] }> {
    const algorithm = this.algorithms.get(config.layout.type)
    
    if (!algorithm) {
      throw new Error(`Unsupported layout type: ${config.layout.type}`)
    }

    const result = algorithm.calculate(nodes, edges, config)

    // 应用动画配置
    if (config.layout.animation.enabled) {
      return this.applyAnimation(result, config.layout.animation.duration)
    }

    return result
  }

  /**
   * 注册自定义布局算法
   */
  registerAlgorithm(algorithm: LayoutAlgorithm): void {
    this.algorithms.set(algorithm.name, algorithm)
  }

  /**
   * 获取可用的布局算法列表
   */
  getAvailableLayouts(): string[] {
    return Array.from(this.algorithms.keys())
  }

  /**
   * 应用动画效果
   */
  private async applyAnimation(
    result: { nodes: MindmapNode[], edges: MindmapEdge[] },
    duration: number
  ): Promise<{ nodes: MindmapNode[], edges: MindmapEdge[] }> {
    // 实际的动画会由React Flow处理，这里只返回结果
    return new Promise(resolve => {
      setTimeout(() => resolve(result), duration)
    })
  }

  /**
   * 自动布局优化
   * 根据节点数量和类型选择最优布局
   */
  suggestOptimalLayout(nodes: MindmapNode[], edges: MindmapEdge[]): string {
    const nodeCount = nodes.length
    const hasHierarchy = nodes.some(n => n.data.level !== undefined)
    const connectionDensity = edges.length / (nodeCount * (nodeCount - 1) / 2)

    if (hasHierarchy && nodeCount < 50) {
      return 'hierarchical'
    } else if (nodeCount < 20) {
      return 'radial'
    } else if (connectionDensity > 0.3) {
      return 'force'
    } else {
      return 'circular'
    }
  }

  /**
   * 计算布局质量分数
   */
  calculateLayoutQuality(nodes: MindmapNode[], edges: MindmapEdge[]): number {
    let score = 0
    
    // 检查节点重叠
    const overlaps = this.countOverlaps(nodes)
    score -= overlaps * 10

    // 检查边交叉
    const crossings = this.countEdgeCrossings(nodes, edges)
    score -= crossings * 5

    // 检查边长度分布
    const avgEdgeLength = this.calculateAverageEdgeLength(nodes, edges)
    const edgeLengthVariance = this.calculateEdgeLengthVariance(nodes, edges, avgEdgeLength)
    score -= edgeLengthVariance

    return Math.max(0, score + 100) // 基础分100分
  }

  private countOverlaps(nodes: MindmapNode[]): number {
    let overlaps = 0
    const nodeSize = 100 // 假设节点大小

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].position.x - nodes[j].position.x
        const dy = nodes[i].position.y - nodes[j].position.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < nodeSize) {
          overlaps++
        }
      }
    }

    return overlaps
  }

  private countEdgeCrossings(nodes: MindmapNode[], edges: MindmapEdge[]): number {
    // 简化的边交叉计算
    let crossings = 0
    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const edge1 = edges[i]
        const edge2 = edges[j]
        
        if (this.edgesIntersect(edge1, edge2, nodeMap)) {
          crossings++
        }
      }
    }

    return crossings
  }

  private edgesIntersect(
    edge1: MindmapEdge, 
    edge2: MindmapEdge, 
    nodeMap: Map<string, MindmapNode>
  ): boolean {
    const n1a = nodeMap.get(edge1.source)
    const n1b = nodeMap.get(edge1.target)
    const n2a = nodeMap.get(edge2.source)
    const n2b = nodeMap.get(edge2.target)

    if (!n1a || !n1b || !n2a || !n2b) return false

    // 简化的线段相交检测
    return this.linesIntersect(
      n1a.position, n1b.position,
      n2a.position, n2b.position
    )
  }

  private linesIntersect(
    p1: { x: number, y: number }, p2: { x: number, y: number },
    p3: { x: number, y: number }, p4: { x: number, y: number }
  ): boolean {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x)
    if (denom === 0) return false

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom

    return t >= 0 && t <= 1 && u >= 0 && u <= 1
  }

  private calculateAverageEdgeLength(nodes: MindmapNode[], edges: MindmapEdge[]): number {
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    let totalLength = 0

    edges.forEach(edge => {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      if (source && target) {
        const dx = source.position.x - target.position.x
        const dy = source.position.y - target.position.y
        totalLength += Math.sqrt(dx * dx + dy * dy)
      }
    })

    return totalLength / edges.length
  }

  private calculateEdgeLengthVariance(
    nodes: MindmapNode[], 
    edges: MindmapEdge[], 
    avgLength: number
  ): number {
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    let variance = 0

    edges.forEach(edge => {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      if (source && target) {
        const dx = source.position.x - target.position.x
        const dy = source.position.y - target.position.y
        const length = Math.sqrt(dx * dx + dy * dy)
        variance += Math.pow(length - avgLength, 2)
      }
    })

    return variance / edges.length
  }
}

export const mindmapLayoutService = new MindmapLayoutService()