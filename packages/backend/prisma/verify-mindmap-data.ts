import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('✅ 开始验证Mindmap模拟数据...')
  console.log('='.repeat(50))

  // 1. 验证项目数据
  const projects = await prisma.project.findMany()
  console.log(`📁 项目数量: ${projects.length}`)
  projects.forEach(project => {
    console.log(`   - ${project.name}: ${project.description}`)
  })

  // 2. 验证数据表数据
  const tables = await prisma.databaseTable.findMany({
    include: {
      project: { select: { name: true } },
      _count: {
        select: { fields: true },
      },
    },
    orderBy: [{ project: { name: 'asc' } }, { category: 'asc' }, { name: 'asc' }],
  })

  console.log(`\n📊 数据表总数: ${tables.length}`)

  const tablesByProject = tables.reduce(
    (acc, table) => {
      const projectName = table.project.name
      if (!acc[projectName]) {
        acc[projectName] = {}
      }
      const category = table.category || '默认分类'
      if (!acc[projectName][category]) {
        acc[projectName][category] = []
      }
      acc[projectName][category].push(table)
      return acc
    },
    {} as Record<string, Record<string, typeof tables>>
  )

  Object.entries(tablesByProject).forEach(([projectName, categories]) => {
    console.log(`\n   🏗️  项目: ${projectName}`)
    Object.entries(categories).forEach(([category, tables]) => {
      console.log(`      📂 ${category} (${tables.length}个表):`)
      tables.forEach(table => {
        console.log(
          `         - ${table.name} (${table.displayName}) [${table._count.fields}字段] - ${table.status}`
        )
      })
    })
  })

  // 3. 验证字段数据
  const fieldCount = await prisma.databaseField.count()
  const primaryKeyCount = await prisma.databaseField.count({
    where: { isPrimaryKey: true },
  })
  const foreignKeyCount = await prisma.databaseField.count({
    where: { referencedTableId: { not: null } },
  })

  console.log(`\n🔢 数据字段统计:`)
  console.log(`   - 字段总数: ${fieldCount}`)
  console.log(`   - 主键字段: ${primaryKeyCount}`)
  console.log(`   - 外键字段: ${foreignKeyCount}`)

  // 4. 验证表关系数据
  const relationships = await prisma.tableRelationship.findMany({
    include: {
      fromTable: { select: { name: true, project: { select: { name: true } } } },
      toTable: { select: { name: true, project: { select: { name: true } } } },
    },
  })

  console.log(`\n🔗 表关系总数: ${relationships.length}`)

  const relsByProject = relationships.reduce(
    (acc, rel) => {
      const projectName = rel.fromTable.project.name
      if (!acc[projectName]) {
        acc[projectName] = []
      }
      acc[projectName].push(rel)
      return acc
    },
    {} as Record<string, typeof relationships>
  )

  Object.entries(relsByProject).forEach(([projectName, rels]) => {
    console.log(`\n   🔗 项目: ${projectName} (${rels.length}个关系)`)
    rels.forEach(rel => {
      console.log(`      - ${rel.fromTable.name} → ${rel.toTable.name} (${rel.relationshipType})`)
    })
  })

  // 5. 验证Mindmap布局数据
  const layouts = await prisma.mindmapLayout.findMany({
    include: {
      project: { select: { name: true } },
    },
  })

  console.log(`\n🎨 Mindmap布局数据: ${layouts.length}个`)

  for (const layout of layouts) {
    const layoutData = JSON.parse(layout.layoutData)
    console.log(`   📐 项目: ${layout.project.name}`)
    console.log(`      - 节点数量: ${layoutData.nodes?.length || 0}`)
    console.log(`      - 连线数量: ${layoutData.edges?.length || 0}`)
    console.log(`      - 布局类型: ${layoutData.config?.layout?.type || '未设置'}`)
    console.log(`      - 创建时间: ${layoutData.metadata?.createdAt || '未知'}`)
  }

  // 6. API端点测试
  console.log(`\n🌐 API端点验证:`)

  for (const project of projects) {
    console.log(`   🔍 测试项目: ${project.name} (${project.id})`)

    try {
      // 测试mindmap数据端点
      const mindmapData = await fetch(`http://localhost:3000/api/v1/mindmap/${project.id}`)
      if (mindmapData.ok) {
        const data = await mindmapData.json()
        console.log(`      ✅ Mindmap数据端点: ${data.success ? '成功' : '失败'}`)
      } else {
        console.log(`      ❌ Mindmap数据端点: HTTP ${mindmapData.status}`)
      }

      // 测试relationships端点
      const relationshipsData = await fetch(
        `http://localhost:3000/api/v1/data-models/relationships?projectId=${project.id}`
      )
      if (relationshipsData.ok) {
        const data = await relationshipsData.json()
        console.log(
          `      ✅ 关系数据端点: ${data.success ? '成功' : '失败'} (${data.data?.relationships?.length || 0}个关系)`
        )
      } else {
        console.log(`      ❌ 关系数据端点: HTTP ${relationshipsData.status}`)
      }

      // 测试布局端点
      const layoutData = await fetch(`http://localhost:3000/api/v1/mindmap/${project.id}/layout`)
      if (layoutData.ok) {
        const data = await layoutData.json()
        console.log(`      ✅ 布局数据端点: ${data.success ? '成功' : '失败'}`)
      } else {
        console.log(`      ❌ 布局数据端点: HTTP ${layoutData.status}`)
      }
    } catch (error) {
      console.log(`      ❌ API测试失败: ${error}`)
    }
  }

  // 总结
  console.log(`\n${'='.repeat(50)}`)
  console.log('📊 验证总结:')
  console.log(`✅ 项目数: ${projects.length}`)
  console.log(`✅ 数据表数: ${tables.length}`)
  console.log(`✅ 字段数: ${fieldCount}`)
  console.log(`✅ 关系数: ${relationships.length}`)
  console.log(`✅ 布局数: ${layouts.length}`)
  console.log('🎉 Mindmap模拟数据验证完成！')

  // 提供快速访问链接
  console.log(`\n🔗 快速访问链接:`)
  projects.forEach(project => {
    console.log(`   📊 ${project.name}: http://localhost:5173/projects/${project.id}/mindmap`)
  })
}

main()
  .catch(e => {
    console.error('❌ 验证失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
