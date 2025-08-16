import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始添加Mindmap模拟数据...')

  // 获取现有项目
  const projects = await prisma.project.findMany()
  console.log(`找到 ${projects.length} 个项目`)

  if (projects.length === 0) {
    console.log('❌ 没有找到项目，请先创建项目')
    return
  }

  // 为第一个项目 (DevAPI Manager) 创建数据表
  const devProject = projects.find(p => p.name.includes('DevAPI')) || projects[0]
  console.log(`📝 为项目 "${devProject.name}" 创建数据表...`)

  // 创建用户相关表
  const usersTable = await prisma.databaseTable.create({
    data: {
      projectId: devProject.id,
      name: 'users',
      displayName: '用户表',
      comment: '系统用户信息表',
      status: 'ACTIVE',
      category: '用户模块',
    }
  })

  const rolesTable = await prisma.databaseTable.create({
    data: {
      projectId: devProject.id,
      name: 'roles',
      displayName: '角色表',
      comment: '用户角色权限表',
      status: 'ACTIVE',
      category: '用户模块',
    }
  })

  const userRolesTable = await prisma.databaseTable.create({
    data: {
      projectId: devProject.id,
      name: 'user_roles',
      displayName: '用户角色关联表',
      comment: '用户与角色的多对多关系表',
      status: 'ACTIVE',
      category: '用户模块',
    }
  })

  // 创建项目相关表
  const projectsTable = await prisma.databaseTable.create({
    data: {
      projectId: devProject.id,
      name: 'projects',
      displayName: '项目表',
      comment: '项目基本信息表',
      status: 'ACTIVE',
      category: '项目模块',
    }
  })

  const apisTable = await prisma.databaseTable.create({
    data: {
      projectId: devProject.id,
      name: 'apis',
      displayName: 'API表',
      comment: 'API接口信息表',
      status: 'ACTIVE',
      category: '项目模块',
    }
  })

  const tagsTable = await prisma.databaseTable.create({
    data: {
      projectId: devProject.id,
      name: 'tags',
      displayName: '标签表',
      comment: 'API标签分类表',
      status: 'ACTIVE',
      category: '项目模块',
    }
  })

  // 创建系统相关表
  const logsTable = await prisma.databaseTable.create({
    data: {
      projectId: devProject.id,
      name: 'system_logs',
      displayName: '系统日志表',
      comment: '系统操作日志记录表',
      status: 'ACTIVE',
      category: '系统模块',
    }
  })

  console.log('✅ 数据表创建完成')

  // 创建字段
  console.log('📝 创建表字段...')

  // users表字段
  await prisma.databaseField.createMany({
    data: [
      {
        tableId: usersTable.id,
        name: 'id',
        type: 'VARCHAR',
        length: 36,
        nullable: false,
        isPrimaryKey: true,
        comment: '用户ID',
        sortOrder: 0
      },
      {
        tableId: usersTable.id,
        name: 'username',
        type: 'VARCHAR',
        length: 50,
        nullable: false,
        comment: '用户名',
        sortOrder: 1
      },
      {
        tableId: usersTable.id,
        name: 'email',
        type: 'VARCHAR',
        length: 100,
        nullable: false,
        comment: '邮箱地址',
        sortOrder: 2
      },
      {
        tableId: usersTable.id,
        name: 'password_hash',
        type: 'VARCHAR',
        length: 255,
        nullable: false,
        comment: '密码哈希',
        sortOrder: 3
      },
      {
        tableId: usersTable.id,
        name: 'status',
        type: 'VARCHAR',
        length: 20,
        nullable: false,
        defaultValue: 'ACTIVE',
        comment: '用户状态',
        sortOrder: 4
      },
      {
        tableId: usersTable.id,
        name: 'created_at',
        type: 'DATETIME',
        nullable: false,
        comment: '创建时间',
        sortOrder: 5
      },
      {
        tableId: usersTable.id,
        name: 'updated_at',
        type: 'DATETIME',
        nullable: false,
        comment: '更新时间',
        sortOrder: 6
      }
    ]
  })

  // roles表字段
  await prisma.databaseField.createMany({
    data: [
      {
        tableId: rolesTable.id,
        name: 'id',
        type: 'VARCHAR',
        length: 36,
        nullable: false,
        isPrimaryKey: true,
        comment: '角色ID',
        sortOrder: 0
      },
      {
        tableId: rolesTable.id,
        name: 'name',
        type: 'VARCHAR',
        length: 50,
        nullable: false,
        comment: '角色名称',
        sortOrder: 1
      },
      {
        tableId: rolesTable.id,
        name: 'description',
        type: 'TEXT',
        nullable: true,
        comment: '角色描述',
        sortOrder: 2
      },
      {
        tableId: rolesTable.id,
        name: 'permissions',
        type: 'JSON',
        nullable: true,
        comment: '权限列表',
        sortOrder: 3
      },
      {
        tableId: rolesTable.id,
        name: 'created_at',
        type: 'DATETIME',
        nullable: false,
        comment: '创建时间',
        sortOrder: 4
      }
    ]
  })

  // user_roles表字段
  await prisma.databaseField.createMany({
    data: [
      {
        tableId: userRolesTable.id,
        name: 'user_id',
        type: 'VARCHAR',
        length: 36,
        nullable: false,
        comment: '用户ID',
        sortOrder: 0,
        referencedTableId: usersTable.id
      },
      {
        tableId: userRolesTable.id,
        name: 'role_id',
        type: 'VARCHAR',
        length: 36,
        nullable: false,
        comment: '角色ID',
        sortOrder: 1,
        referencedTableId: rolesTable.id
      },
      {
        tableId: userRolesTable.id,
        name: 'assigned_at',
        type: 'DATETIME',
        nullable: false,
        comment: '分配时间',
        sortOrder: 2
      }
    ]
  })

  // projects表字段
  await prisma.databaseField.createMany({
    data: [
      {
        tableId: projectsTable.id,
        name: 'id',
        type: 'VARCHAR',
        length: 36,
        nullable: false,
        isPrimaryKey: true,
        comment: '项目ID',
        sortOrder: 0
      },
      {
        tableId: projectsTable.id,
        name: 'name',
        type: 'VARCHAR',
        length: 100,
        nullable: false,
        comment: '项目名称',
        sortOrder: 1
      },
      {
        tableId: projectsTable.id,
        name: 'description',
        type: 'TEXT',
        nullable: true,
        comment: '项目描述',
        sortOrder: 2
      },
      {
        tableId: projectsTable.id,
        name: 'owner_id',
        type: 'VARCHAR',
        length: 36,
        nullable: false,
        comment: '项目所有者ID',
        sortOrder: 3,
        referencedTableId: usersTable.id
      },
      {
        tableId: projectsTable.id,
        name: 'status',
        type: 'VARCHAR',
        length: 20,
        nullable: false,
        defaultValue: 'ACTIVE',
        comment: '项目状态',
        sortOrder: 4
      },
      {
        tableId: projectsTable.id,
        name: 'created_at',
        type: 'DATETIME',
        nullable: false,
        comment: '创建时间',
        sortOrder: 5
      },
      {
        tableId: projectsTable.id,
        name: 'updated_at',
        type: 'DATETIME',
        nullable: false,
        comment: '更新时间',
        sortOrder: 6
      }
    ]
  })

  // apis表字段
  await prisma.databaseField.createMany({
    data: [
      {
        tableId: apisTable.id,
        name: 'id',
        type: 'VARCHAR',
        length: 36,
        nullable: false,
        isPrimaryKey: true,
        comment: 'API ID',
        sortOrder: 0
      },
      {
        tableId: apisTable.id,
        name: 'project_id',
        type: 'VARCHAR',
        length: 36,
        nullable: false,
        comment: '所属项目ID',
        sortOrder: 1,
        referencedTableId: projectsTable.id
      },
      {
        tableId: apisTable.id,
        name: 'name',
        type: 'VARCHAR',
        length: 100,
        nullable: false,
        comment: 'API名称',
        sortOrder: 2
      },
      {
        tableId: apisTable.id,
        name: 'method',
        type: 'VARCHAR',
        length: 10,
        nullable: false,
        comment: 'HTTP方法',
        sortOrder: 3
      },
      {
        tableId: apisTable.id,
        name: 'path',
        type: 'VARCHAR',
        length: 255,
        nullable: false,
        comment: 'API路径',
        sortOrder: 4
      },
      {
        tableId: apisTable.id,
        name: 'description',
        type: 'TEXT',
        nullable: true,
        comment: 'API描述',
        sortOrder: 5
      },
      {
        tableId: apisTable.id,
        name: 'status',
        type: 'VARCHAR',
        length: 20,
        nullable: false,
        defaultValue: 'NOT_STARTED',
        comment: '开发状态',
        sortOrder: 6
      },
      {
        tableId: apisTable.id,
        name: 'created_at',
        type: 'DATETIME',
        nullable: false,
        comment: '创建时间',
        sortOrder: 7
      }
    ]
  })

  // tags表字段
  await prisma.databaseField.createMany({
    data: [
      {
        tableId: tagsTable.id,
        name: 'id',
        type: 'VARCHAR',
        length: 36,
        nullable: false,
        isPrimaryKey: true,
        comment: '标签ID',
        sortOrder: 0
      },
      {
        tableId: tagsTable.id,
        name: 'name',
        type: 'VARCHAR',
        length: 50,
        nullable: false,
        comment: '标签名称',
        sortOrder: 1
      },
      {
        tableId: tagsTable.id,
        name: 'color',
        type: 'VARCHAR',
        length: 7,
        nullable: false,
        defaultValue: '#3B82F6',
        comment: '标签颜色',
        sortOrder: 2
      },
      {
        tableId: tagsTable.id,
        name: 'project_id',
        type: 'VARCHAR',
        length: 36,
        nullable: false,
        comment: '所属项目ID',
        sortOrder: 3,
        referencedTableId: projectsTable.id
      }
    ]
  })

  // system_logs表字段
  await prisma.databaseField.createMany({
    data: [
      {
        tableId: logsTable.id,
        name: 'id',
        type: 'VARCHAR',
        length: 36,
        nullable: false,
        isPrimaryKey: true,
        comment: '日志ID',
        sortOrder: 0
      },
      {
        tableId: logsTable.id,
        name: 'user_id',
        type: 'VARCHAR',
        length: 36,
        nullable: true,
        comment: '操作用户ID',
        sortOrder: 1,
        referencedTableId: usersTable.id
      },
      {
        tableId: logsTable.id,
        name: 'action',
        type: 'VARCHAR',
        length: 100,
        nullable: false,
        comment: '操作类型',
        sortOrder: 2
      },
      {
        tableId: logsTable.id,
        name: 'resource_type',
        type: 'VARCHAR',
        length: 50,
        nullable: true,
        comment: '资源类型',
        sortOrder: 3
      },
      {
        tableId: logsTable.id,
        name: 'resource_id',
        type: 'VARCHAR',
        length: 36,
        nullable: true,
        comment: '资源ID',
        sortOrder: 4
      },
      {
        tableId: logsTable.id,
        name: 'details',
        type: 'JSON',
        nullable: true,
        comment: '操作详情',
        sortOrder: 5
      },
      {
        tableId: logsTable.id,
        name: 'ip_address',
        type: 'VARCHAR',
        length: 45,
        nullable: true,
        comment: 'IP地址',
        sortOrder: 6
      },
      {
        tableId: logsTable.id,
        name: 'created_at',
        type: 'DATETIME',
        nullable: false,
        comment: '创建时间',
        sortOrder: 7
      }
    ]
  })

  console.log('✅ 表字段创建完成')

  // 如果有第二个项目，为其创建电商相关的数据表
  if (projects.length > 1) {
    const ecommerceProject = projects.find(p => p.name.includes('E-commerce')) || projects[1]
    console.log(`📝 为项目 "${ecommerceProject.name}" 创建电商数据表...`)

    // 创建电商相关表
    const customersTable = await prisma.databaseTable.create({
      data: {
        projectId: ecommerceProject.id,
        name: 'customers',
        displayName: '客户表',
        comment: '电商客户信息表',
        status: 'ACTIVE',
        category: '用户管理',
      }
    })

    const productsTable = await prisma.databaseTable.create({
      data: {
        projectId: ecommerceProject.id,
        name: 'products',
        displayName: '商品表',
        comment: '商品基本信息表',
        status: 'ACTIVE',
        category: '商品管理',
      }
    })

    const categoriesTable = await prisma.databaseTable.create({
      data: {
        projectId: ecommerceProject.id,
        name: 'categories',
        displayName: '分类表',
        comment: '商品分类表',
        status: 'ACTIVE',
        category: '商品管理',
      }
    })

    const ordersTable = await prisma.databaseTable.create({
      data: {
        projectId: ecommerceProject.id,
        name: 'orders',
        displayName: '订单表',
        comment: '客户订单信息表',
        status: 'ACTIVE',
        category: '订单管理',
      }
    })

    const orderItemsTable = await prisma.databaseTable.create({
      data: {
        projectId: ecommerceProject.id,
        name: 'order_items',
        displayName: '订单项表',
        comment: '订单商品详情表',
        status: 'ACTIVE',
        category: '订单管理',
      }
    })

    // 为电商表创建基础字段（简化版）
    await prisma.databaseField.createMany({
      data: [
        // customers表
        { tableId: customersTable.id, name: 'id', type: 'VARCHAR', length: 36, nullable: false, isPrimaryKey: true, comment: '客户ID', sortOrder: 0 },
        { tableId: customersTable.id, name: 'name', type: 'VARCHAR', length: 100, nullable: false, comment: '客户姓名', sortOrder: 1 },
        { tableId: customersTable.id, name: 'email', type: 'VARCHAR', length: 100, nullable: false, comment: '邮箱', sortOrder: 2 },
        { tableId: customersTable.id, name: 'phone', type: 'VARCHAR', length: 20, nullable: true, comment: '电话', sortOrder: 3 },
        { tableId: customersTable.id, name: 'address', type: 'TEXT', nullable: true, comment: '地址', sortOrder: 4 },
        { tableId: customersTable.id, name: 'created_at', type: 'DATETIME', nullable: false, comment: '注册时间', sortOrder: 5 },

        // products表
        { tableId: productsTable.id, name: 'id', type: 'VARCHAR', length: 36, nullable: false, isPrimaryKey: true, comment: '商品ID', sortOrder: 0 },
        { tableId: productsTable.id, name: 'name', type: 'VARCHAR', length: 200, nullable: false, comment: '商品名称', sortOrder: 1 },
        { tableId: productsTable.id, name: 'description', type: 'TEXT', nullable: true, comment: '商品描述', sortOrder: 2 },
        { tableId: productsTable.id, name: 'price', type: 'DECIMAL', precision: 10, scale: 2, nullable: false, comment: '价格', sortOrder: 3 },
        { tableId: productsTable.id, name: 'category_id', type: 'VARCHAR', length: 36, nullable: false, comment: '分类ID', sortOrder: 4, referencedTableId: categoriesTable.id },
        { tableId: productsTable.id, name: 'stock', type: 'INT', nullable: false, defaultValue: '0', comment: '库存', sortOrder: 5 },
        { tableId: productsTable.id, name: 'status', type: 'VARCHAR', length: 20, nullable: false, defaultValue: 'ACTIVE', comment: '状态', sortOrder: 6 },
        { tableId: productsTable.id, name: 'created_at', type: 'DATETIME', nullable: false, comment: '创建时间', sortOrder: 7 },

        // categories表
        { tableId: categoriesTable.id, name: 'id', type: 'VARCHAR', length: 36, nullable: false, isPrimaryKey: true, comment: '分类ID', sortOrder: 0 },
        { tableId: categoriesTable.id, name: 'name', type: 'VARCHAR', length: 100, nullable: false, comment: '分类名称', sortOrder: 1 },
        { tableId: categoriesTable.id, name: 'parent_id', type: 'VARCHAR', length: 36, nullable: true, comment: '父分类ID', sortOrder: 2, referencedTableId: categoriesTable.id },
        { tableId: categoriesTable.id, name: 'sort_order', type: 'INT', nullable: false, defaultValue: '0', comment: '排序', sortOrder: 3 },
        { tableId: categoriesTable.id, name: 'created_at', type: 'DATETIME', nullable: false, comment: '创建时间', sortOrder: 4 },

        // orders表
        { tableId: ordersTable.id, name: 'id', type: 'VARCHAR', length: 36, nullable: false, isPrimaryKey: true, comment: '订单ID', sortOrder: 0 },
        { tableId: ordersTable.id, name: 'customer_id', type: 'VARCHAR', length: 36, nullable: false, comment: '客户ID', sortOrder: 1, referencedTableId: customersTable.id },
        { tableId: ordersTable.id, name: 'order_number', type: 'VARCHAR', length: 50, nullable: false, comment: '订单号', sortOrder: 2 },
        { tableId: ordersTable.id, name: 'total_amount', type: 'DECIMAL', precision: 10, scale: 2, nullable: false, comment: '订单总额', sortOrder: 3 },
        { tableId: ordersTable.id, name: 'status', type: 'VARCHAR', length: 20, nullable: false, defaultValue: 'PENDING', comment: '订单状态', sortOrder: 4 },
        { tableId: ordersTable.id, name: 'created_at', type: 'DATETIME', nullable: false, comment: '下单时间', sortOrder: 5 },

        // order_items表
        { tableId: orderItemsTable.id, name: 'id', type: 'VARCHAR', length: 36, nullable: false, isPrimaryKey: true, comment: '订单项ID', sortOrder: 0 },
        { tableId: orderItemsTable.id, name: 'order_id', type: 'VARCHAR', length: 36, nullable: false, comment: '订单ID', sortOrder: 1, referencedTableId: ordersTable.id },
        { tableId: orderItemsTable.id, name: 'product_id', type: 'VARCHAR', length: 36, nullable: false, comment: '商品ID', sortOrder: 2, referencedTableId: productsTable.id },
        { tableId: orderItemsTable.id, name: 'quantity', type: 'INT', nullable: false, comment: '数量', sortOrder: 3 },
        { tableId: orderItemsTable.id, name: 'price', type: 'DECIMAL', precision: 10, scale: 2, nullable: false, comment: '单价', sortOrder: 4 },
        { tableId: orderItemsTable.id, name: 'total_price', type: 'DECIMAL', precision: 10, scale: 2, nullable: false, comment: '小计', sortOrder: 5 }
      ]
    })

    console.log('✅ 电商数据表创建完成')
  }

  console.log('🎉 Mindmap模拟数据创建完成！')
}

main()
  .catch((e) => {
    console.error('❌ 创建模拟数据失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })