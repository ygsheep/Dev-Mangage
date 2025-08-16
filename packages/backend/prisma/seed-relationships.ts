import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔗 开始创建表关系数据...')

  // 获取所有数据表
  const tables = await prisma.databaseTable.findMany({
    include: {
      fields: true,
      project: true
    }
  })

  console.log(`找到 ${tables.length} 个数据表`)

  if (tables.length === 0) {
    console.log('❌ 没有找到数据表，请先运行 seed-mindmap.ts')
    return
  }

  // 按项目分组
  const tablesByProject = tables.reduce((acc, table) => {
    if (!acc[table.projectId]) {
      acc[table.projectId] = []
    }
    acc[table.projectId].push(table)
    return acc
  }, {} as Record<string, typeof tables>)

  // 为每个项目创建关系
  for (const [projectId, projectTables] of Object.entries(tablesByProject)) {
    const projectName = projectTables[0].project.name
    console.log(`📝 为项目 "${projectName}" 创建表关系...`)

    if (projectName.includes('DevAPI')) {
      // DevAPI Manager 项目的关系
      await createDevAPIRelationships(projectTables)
    } else if (projectName.includes('E-commerce')) {
      // E-commerce 项目的关系
      await createEcommerceRelationships(projectTables)
    }
  }

  console.log('🎉 表关系数据创建完成！')
}

async function createDevAPIRelationships(tables: any[]) {
  // 查找表和字段
  const usersTable = tables.find(t => t.name === 'users')
  const rolesTable = tables.find(t => t.name === 'roles')
  const userRolesTable = tables.find(t => t.name === 'user_roles')
  const projectsTable = tables.find(t => t.name === 'projects')
  const apisTable = tables.find(t => t.name === 'apis')
  const tagsTable = tables.find(t => t.name === 'tags')
  const logsTable = tables.find(t => t.name === 'system_logs')

  if (!usersTable || !rolesTable || !userRolesTable || !projectsTable || !apisTable || !tagsTable || !logsTable) {
    console.log('⚠️ DevAPI表不完整，跳过关系创建')
    return
  }

  // 获取字段ID的辅助函数
  const getFieldId = (table: any, fieldName: string) => {
    const field = table.fields.find((f: any) => f.name === fieldName)
    return field ? field.id : null
  }

  const relationships = [
    // user_roles -> users (多对一)
    {
      fromTableId: userRolesTable.id,
      toTableId: usersTable.id,
      fromFieldId: getFieldId(userRolesTable, 'user_id'),
      toFieldId: getFieldId(usersTable, 'id'),
      relationshipType: 'MANY_TO_ONE',
      name: 'user_roles_user_fk',
      description: '用户角色关联表到用户表的外键关系'
    },
    // user_roles -> roles (多对一)
    {
      fromTableId: userRolesTable.id,
      toTableId: rolesTable.id,
      fromFieldId: getFieldId(userRolesTable, 'role_id'),
      toFieldId: getFieldId(rolesTable, 'id'),
      relationshipType: 'MANY_TO_ONE',
      name: 'user_roles_role_fk',
      description: '用户角色关联表到角色表的外键关系'
    },
    // projects -> users (多对一，项目所有者)
    {
      fromTableId: projectsTable.id,
      toTableId: usersTable.id,
      fromFieldId: getFieldId(projectsTable, 'owner_id'),
      toFieldId: getFieldId(usersTable, 'id'),
      relationshipType: 'MANY_TO_ONE',
      name: 'projects_owner_fk',
      description: '项目表到用户表的所有者外键关系'
    },
    // apis -> projects (多对一)
    {
      fromTableId: apisTable.id,
      toTableId: projectsTable.id,
      fromFieldId: getFieldId(apisTable, 'project_id'),
      toFieldId: getFieldId(projectsTable, 'id'),
      relationshipType: 'MANY_TO_ONE',
      name: 'apis_project_fk',
      description: 'API表到项目表的外键关系'
    },
    // tags -> projects (多对一)
    {
      fromTableId: tagsTable.id,
      toTableId: projectsTable.id,
      fromFieldId: getFieldId(tagsTable, 'project_id'),
      toFieldId: getFieldId(projectsTable, 'id'),
      relationshipType: 'MANY_TO_ONE',
      name: 'tags_project_fk',
      description: '标签表到项目表的外键关系'
    },
    // system_logs -> users (多对一，可选)
    {
      fromTableId: logsTable.id,
      toTableId: usersTable.id,
      fromFieldId: getFieldId(logsTable, 'user_id'),
      toFieldId: getFieldId(usersTable, 'id'),
      relationshipType: 'MANY_TO_ONE',
      name: 'logs_user_fk',
      description: '系统日志表到用户表的外键关系（可选）'
    }
  ]

  // 过滤掉字段ID为空的关系
  const validRelationships = relationships.filter(rel => 
    rel.fromFieldId && rel.toFieldId
  )

  if (validRelationships.length > 0) {
    await prisma.tableRelationship.createMany({
      data: validRelationships
    })
    console.log(`✅ 创建了 ${validRelationships.length} 个DevAPI表关系`)
  }
}

async function createEcommerceRelationships(tables: any[]) {
  // 查找表和字段
  const customersTable = tables.find(t => t.name === 'customers')
  const productsTable = tables.find(t => t.name === 'products')
  const categoriesTable = tables.find(t => t.name === 'categories')
  const ordersTable = tables.find(t => t.name === 'orders')
  const orderItemsTable = tables.find(t => t.name === 'order_items')

  if (!customersTable || !productsTable || !categoriesTable || !ordersTable || !orderItemsTable) {
    console.log('⚠️ 电商表不完整，跳过关系创建')
    return
  }

  // 获取字段ID的辅助函数
  const getFieldId = (table: any, fieldName: string) => {
    const field = table.fields.find((f: any) => f.name === fieldName)
    return field ? field.id : null
  }

  const relationships = [
    // products -> categories (多对一)
    {
      fromTableId: productsTable.id,
      toTableId: categoriesTable.id,
      fromFieldId: getFieldId(productsTable, 'category_id'),
      toFieldId: getFieldId(categoriesTable, 'id'),
      relationshipType: 'MANY_TO_ONE',
      name: 'products_category_fk',
      description: '商品表到分类表的外键关系'
    },
    // categories -> categories (自引用，父分类)
    {
      fromTableId: categoriesTable.id,
      toTableId: categoriesTable.id,
      fromFieldId: getFieldId(categoriesTable, 'parent_id'),
      toFieldId: getFieldId(categoriesTable, 'id'),
      relationshipType: 'MANY_TO_ONE',
      name: 'categories_parent_fk',
      description: '分类表的自引用父分类关系'
    },
    // orders -> customers (多对一)
    {
      fromTableId: ordersTable.id,
      toTableId: customersTable.id,
      fromFieldId: getFieldId(ordersTable, 'customer_id'),
      toFieldId: getFieldId(customersTable, 'id'),
      relationshipType: 'MANY_TO_ONE',
      name: 'orders_customer_fk',
      description: '订单表到客户表的外键关系'
    },
    // order_items -> orders (多对一)
    {
      fromTableId: orderItemsTable.id,
      toTableId: ordersTable.id,
      fromFieldId: getFieldId(orderItemsTable, 'order_id'),
      toFieldId: getFieldId(ordersTable, 'id'),
      relationshipType: 'MANY_TO_ONE',
      name: 'order_items_order_fk',
      description: '订单项表到订单表的外键关系'
    },
    // order_items -> products (多对一)
    {
      fromTableId: orderItemsTable.id,
      toTableId: productsTable.id,
      fromFieldId: getFieldId(orderItemsTable, 'product_id'),
      toFieldId: getFieldId(productsTable, 'id'),
      relationshipType: 'MANY_TO_ONE',
      name: 'order_items_product_fk',
      description: '订单项表到商品表的外键关系'
    }
  ]

  // 过滤掉字段ID为空的关系
  const validRelationships = relationships.filter(rel => 
    rel.fromFieldId && rel.toFieldId
  )

  if (validRelationships.length > 0) {
    await prisma.tableRelationship.createMany({
      data: validRelationships
    })
    console.log(`✅ 创建了 ${validRelationships.length} 个电商表关系`)
  }
}

main()
  .catch((e) => {
    console.error('❌ 创建表关系失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })