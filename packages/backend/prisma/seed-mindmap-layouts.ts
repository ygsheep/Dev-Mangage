import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎨 开始创建Mindmap布局数据...')

  // 获取所有项目
  const projects = await prisma.project.findMany({
    include: {
      databaseTables: {
        include: {
          fields: true
        }
      }
    }
  })

  console.log(`找到 ${projects.length} 个项目`)

  for (const project of projects) {
    if (project.databaseTables.length === 0) {
      console.log(`⚠️ 项目 "${project.name}" 没有数据表，跳过布局创建`)
      continue
    }

    console.log(`📝 为项目 "${project.name}" 创建Mindmap布局...`)

    // 创建节点数据
    const nodes = []
    const edges = []

    // 根节点 - 项目
    const projectNode = {
      id: `project-${project.id}`,
      type: 'project',
      position: { x: 0, y: 0 },
      data: {
        id: project.id,
        entityType: 'project',
        entityId: project.id,
        name: project.name,
        description: project.description || '项目根节点',
        status: project.status,
        icon: 'folder',
        color: '#3B82F6',
        tableCount: project.databaseTables.length,
        fieldCount: project.databaseTables.reduce((acc, table) => acc + table.fields.length, 0)
      }
    }
    nodes.push(projectNode)

    // 按分类分组表
    const tablesByCategory = project.databaseTables.reduce((acc, table) => {
      const category = table.category || '默认分类'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(table)
      return acc
    }, {} as Record<string, typeof project.databaseTables>)

    const categories = Object.keys(tablesByCategory)
    const categoryNodes = []

    // 创建分类节点
    categories.forEach((category, index) => {
      const categoryNodeId = `category-${category}-${project.id}`
      const categoryNode = {
        id: categoryNodeId,
        type: 'category',
        position: { 
          x: Math.cos((index * 2 * Math.PI) / categories.length) * 300, 
          y: Math.sin((index * 2 * Math.PI) / categories.length) * 300 
        },
        data: {
          id: categoryNodeId,
          entityType: 'category',
          entityId: category,
          name: category,
          description: `${category}模块，包含${tablesByCategory[category].length}个数据表`,
          icon: 'folder-open',
          color: getCategoryColor(category),
          tableCount: tablesByCategory[category].length
        }
      }
      nodes.push(categoryNode)
      categoryNodes.push(categoryNode)

      // 项目到分类的连线
      edges.push({
        id: `project-to-${categoryNodeId}`,
        source: projectNode.id,
        target: categoryNodeId,
        type: 'hierarchy',
        data: {
          id: `project-to-${categoryNodeId}`,
          type: 'hierarchy',
          label: '包含',
          style: 'solid'
        }
      })

      // 创建该分类下的表节点
      tablesByCategory[category].forEach((table, tableIndex) => {
        const tableNodeId = `table-${table.id}`
        
        // 计算表节点位置（围绕分类节点排列）
        const angle = (tableIndex * 2 * Math.PI) / tablesByCategory[category].length
        const radius = 150
        const tableX = categoryNode.position.x + Math.cos(angle) * radius
        const tableY = categoryNode.position.y + Math.sin(angle) * radius

        const tableNode = {
          id: tableNodeId,
          type: 'table',
          position: { x: tableX, y: tableY },
          data: {
            id: table.id,
            entityType: 'table',
            entityId: table.id,
            name: table.name,
            displayName: table.displayName || table.name,
            description: table.comment || `${table.name}数据表`,
            status: table.status,
            icon: 'table',
            color: getTableStatusColor(table.status),
            fieldCount: table.fields.length,
            primaryKeys: table.fields.filter(f => f.isPrimaryKey).length,
            foreignKeys: table.fields.filter(f => f.referencedTableId).length,
            fields: table.fields.map(field => ({
              id: field.id,
              name: field.name,
              type: field.type,
              length: field.length,
              nullable: field.nullable,
              isPrimaryKey: field.isPrimaryKey,
              comment: field.comment
            }))
          }
        }
        nodes.push(tableNode)

        // 分类到表的连线
        edges.push({
          id: `category-to-${tableNodeId}`,
          source: categoryNodeId,
          target: tableNodeId,
          type: 'hierarchy',
          data: {
            id: `category-to-${tableNodeId}`,
            type: 'hierarchy',
            label: '包含',
            style: 'solid'
          }
        })
      })
    })

    // 添加表之间的外键关系连线
    const relationships = await prisma.tableRelationship.findMany({
      where: {
        OR: [
          { fromTable: { projectId: project.id } },
          { toTable: { projectId: project.id } }
        ]
      }
    })

    relationships.forEach(rel => {
      const edgeId = `rel-${rel.id}`
      edges.push({
        id: edgeId,
        source: `table-${rel.fromTableId}`,
        target: `table-${rel.toTableId}`,
        type: rel.relationshipType === 'MANY_TO_ONE' ? 'foreignKey' : 'reference',
        data: {
          id: rel.id,
          relationshipId: rel.id,
          type: rel.relationshipType.toLowerCase(),
          label: rel.name || rel.relationshipType,
          description: rel.description,
          style: rel.relationshipType === 'MANY_TO_ONE' ? 'dashed' : 'solid'
        }
      })
    })

    // 创建布局配置
    const layoutData = {
      nodes,
      edges,
      config: {
        layout: {
          type: 'radial',
          direction: 'TB',
          spacing: {
            node: 150,
            level: 200
          },
          animation: {
            enabled: true,
            duration: 800
          }
        },
        display: {
          showLabels: true,
          showIcons: true,
          showStatistics: true,
          showRelationshipLabels: true,
          compactMode: false
        },
        interaction: {
          enableDrag: true,
          enableZoom: true,
          enableSelection: true,
          enableCollapse: false,
          autoLayout: false
        },
        filters: {
          nodeTypes: ['project', 'category', 'table'],
          relationshipTypes: ['hierarchy', 'foreignKey', 'reference'],
          statuses: ['ACTIVE', 'DRAFT', 'DEPRECATED']
        }
      },
      viewport: {
        x: 0,
        y: 0,
        zoom: 0.8
      },
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        nodeCount: nodes.length,
        edgeCount: edges.length,
        lastUpdated: new Date().toISOString()
      }
    }

    // 保存布局数据到数据库
    try {
      await prisma.mindmapLayout.upsert({
        where: { projectId: project.id },
        update: {
          layoutData: JSON.stringify(layoutData)
        },
        create: {
          projectId: project.id,
          layoutData: JSON.stringify(layoutData)
        }
      })
      
      console.log(`✅ 项目 "${project.name}" 的Mindmap布局已保存 (${nodes.length}个节点, ${edges.length}条连线)`)
    } catch (error) {
      console.error(`❌ 保存项目 "${project.name}" 的Mindmap布局失败:`, error)
    }
  }

  console.log('🎉 Mindmap布局数据创建完成！')
}

// 根据分类名称获取颜色
function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    '用户模块': '#10B981',      // 绿色
    '用户管理': '#10B981',      // 绿色
    '项目模块': '#3B82F6',      // 蓝色
    '商品管理': '#F59E0B',      // 橙色
    '订单管理': '#EF4444',      // 红色
    '系统模块': '#6B7280',      // 灰色
    '默认分类': '#8B5CF6'       // 紫色
  }
  return colorMap[category] || '#8B5CF6'
}

// 根据表状态获取颜色
function getTableStatusColor(status: string): string {
  const statusColorMap: Record<string, string> = {
    'ACTIVE': '#10B981',       // 绿色
    'DRAFT': '#F59E0B',        // 橙色
    'DEPRECATED': '#EF4444'    // 红色
  }
  return statusColorMap[status] || '#6B7280'
}

main()
  .catch((e) => {
    console.error('❌ 创建Mindmap布局失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })