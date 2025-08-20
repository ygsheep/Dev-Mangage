import { prisma } from '../lib/prisma'

async function seedFeatures() {
  console.log('开始添加功能模块种子数据...')

  try {
    // 获取第一个项目
    const project = await prisma.project.findFirst()
    
    if (!project) {
      console.log('未找到项目，跳过功能模块种子数据添加')
      return
    }

    console.log(`为项目 ${project.name} 添加功能模块...`)

    // 清除现有的功能模块数据
    await prisma.featureModule.deleteMany({
      where: { projectId: project.id }
    })

    // 创建功能模块数据
    const modules = [
      {
        projectId: project.id,
        name: '用户管理',
        displayName: '用户管理系统',
        description: '用户注册、登录、密码重置、用户信息管理等基础认证功能',
        status: 'completed',
        category: '用户系统',
        priority: 'HIGH',
        progress: 100,
        tags: JSON.stringify(['JWT认证', '邮箱验证', '密码加密']),
        techStack: JSON.stringify(['Node.js', 'Express', 'JWT', 'bcrypt']),
        estimatedHours: 40,
        actualHours: 38,
        assigneeName: '张开发',
        startDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-15'),
        completedAt: new Date('2024-01-14'),
        createdBy: 'system',
        sortOrder: 1,
      },
      {
        projectId: project.id,
        name: '权限管理',
        displayName: 'RBAC权限控制',
        description: '基于角色的权限控制(RBAC)、菜单权限、数据权限、API权限管理',
        status: 'in-progress',
        category: '权限系统',
        priority: 'HIGH',
        progress: 65,
        tags: JSON.stringify(['RBAC', '菜单控制', '数据权限']),
        techStack: JSON.stringify(['Node.js', 'Express', 'Prisma']),
        estimatedHours: 60,
        actualHours: 35,
        assigneeName: '李架构',
        startDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        createdBy: 'system',
        sortOrder: 2,
      },
      {
        projectId: project.id,
        name: '文件管理',
        displayName: '文件存储系统',
        description: '文件上传、下载、预览、存储管理、缩略图生成等文件操作功能',
        status: 'planned',
        category: '文件系统',
        priority: 'MEDIUM',
        progress: 0,
        tags: JSON.stringify(['OSS存储', '缩略图', '文件预览']),
        techStack: JSON.stringify(['Node.js', 'Multer', 'Sharp', 'AWS S3']),
        estimatedHours: 50,
        assigneeName: '王后端',
        startDate: new Date('2024-02-01'),
        dueDate: new Date('2024-02-28'),
        createdBy: 'system',
        sortOrder: 3,
      },
      {
        projectId: project.id,
        name: '消息通知',
        displayName: '消息推送系统',
        description: '系统消息、邮件通知、短信通知、推送通知等消息管理功能',
        status: 'planned',
        category: '消息系统',
        priority: 'MEDIUM',
        progress: 0,
        tags: JSON.stringify(['邮件通知', '短信', '推送']),
        techStack: JSON.stringify(['Node.js', 'Nodemailer', 'Socket.io']),
        estimatedHours: 35,
        assigneeName: '赵前端',
        startDate: new Date('2024-02-15'),
        dueDate: new Date('2024-03-15'),
        createdBy: 'system',
        sortOrder: 4,
      },
      {
        projectId: project.id,
        name: '数据导出',
        displayName: '报表导出系统',
        description: 'Excel导出、PDF报告、数据备份、批量导出等数据导出功能',
        status: 'completed',
        category: '数据系统',
        priority: 'LOW',
        progress: 100,
        tags: JSON.stringify(['Excel导出', 'PDF生成', '数据备份']),
        techStack: JSON.stringify(['Node.js', 'ExcelJS', 'PDFKit']),
        estimatedHours: 25,
        actualHours: 28,
        assigneeName: '钱测试',
        startDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-10'),
        completedAt: new Date('2024-02-08'),
        createdBy: 'system',
        sortOrder: 5,
      },
      {
        projectId: project.id,
        name: 'API文档',
        displayName: 'API文档管理',
        description: 'Swagger文档生成、API版本管理、在线测试、文档导出等功能',
        status: 'in-progress',
        category: '开发工具',
        priority: 'MEDIUM',
        progress: 30,
        tags: JSON.stringify(['Swagger', 'API文档', '在线测试']),
        techStack: JSON.stringify(['Node.js', 'Swagger', 'OpenAPI']),
        estimatedHours: 20,
        actualHours: 8,
        assigneeName: '孙文档',
        startDate: new Date('2024-02-20'),
        dueDate: new Date('2024-03-10'),
        createdBy: 'system',
        sortOrder: 6,
      },
    ]

    // 创建功能模块
    const createdModules = []
    for (const moduleData of modules) {
      const module = await prisma.featureModule.create({
        data: moduleData
      })
      createdModules.push(module)
      console.log(`✅ 创建功能模块: ${module.name}`)
    }

    // 为每个模块添加一些端点和任务
    for (const module of createdModules) {
      // 添加模块端点
      const endpoints = getEndpointsForModule(module.name, module.id)
      for (const endpointData of endpoints) {
        await prisma.moduleEndpoint.create({
          data: endpointData
        })
      }

      // 添加模块任务
      const tasks = getTasksForModule(module.name, module.id, module.status)
      for (const taskData of tasks) {
        await prisma.moduleTask.create({
          data: taskData
        })
      }

      // 添加模块文档
      const docs = getDocsForModule(module.name, module.id)
      for (const docData of docs) {
        await prisma.moduleDocument.create({
          data: docData
        })
      }
    }

    // 添加模块依赖关系
    const userModule = createdModules.find(m => m.name === '用户管理')
    const permissionModule = createdModules.find(m => m.name === '权限管理')
    const fileModule = createdModules.find(m => m.name === '文件管理')

    if (userModule && permissionModule) {
      await prisma.moduleDependency.create({
        data: {
          fromModuleId: permissionModule.id,
          toModuleId: userModule.id,
          dependencyType: 'REQUIRES',
          description: '权限管理依赖用户管理提供的用户身份认证',
          isRequired: true,
        }
      })
    }

    if (userModule && fileModule) {
      await prisma.moduleDependency.create({
        data: {
          fromModuleId: fileModule.id,
          toModuleId: userModule.id,
          dependencyType: 'REQUIRES',
          description: '文件管理需要用户认证来控制文件访问权限',
          isRequired: true,
        }
      })
    }

    console.log(`✅ 成功为项目 ${project.name} 创建了 ${createdModules.length} 个功能模块`)
    console.log('✅ 功能模块种子数据添加完成')

  } catch (error) {
    console.error('❌ 添加功能模块种子数据失败:', error)
    throw error
  }
}

function getEndpointsForModule(moduleName: string, moduleId: string) {
  const endpointMap: Record<string, any[]> = {
    '用户管理': [
      {
        moduleId,
        name: '用户注册',
        method: 'POST',
        path: '/api/v1/auth/register',
        description: '用户注册接口',
        status: 'implemented',
        priority: 'HIGH',
        requestSchema: JSON.stringify({
          type: 'object',
          properties: {
            username: { type: 'string' },
            email: { type: 'string' },
            password: { type: 'string' }
          }
        }),
        responseSchema: JSON.stringify({
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            token: { type: 'string' }
          }
        })
      },
      {
        moduleId,
        name: '用户登录',
        method: 'POST',
        path: '/api/v1/auth/login',
        description: '用户登录接口',
        status: 'implemented',
        priority: 'HIGH',
      },
      {
        moduleId,
        name: '获取用户信息',
        method: 'GET',
        path: '/api/v1/users/profile',
        description: '获取当前用户信息',
        status: 'implemented',
        priority: 'MEDIUM',
      },
    ],
    '权限管理': [
      {
        moduleId,
        name: '获取角色列表',
        method: 'GET',
        path: '/api/v1/roles',
        description: '获取系统角色列表',
        status: 'implementing',
        priority: 'HIGH',
      },
      {
        moduleId,
        name: '权限检查',
        method: 'POST',
        path: '/api/v1/permissions/check',
        description: '检查用户是否有指定权限',
        status: 'planned',
        priority: 'HIGH',
      },
    ],
    '文件管理': [
      {
        moduleId,
        name: '文件上传',
        method: 'POST',
        path: '/api/v1/files/upload',
        description: '单文件或多文件上传',
        status: 'planned',
        priority: 'HIGH',
      },
      {
        moduleId,
        name: '文件下载',
        method: 'GET',
        path: '/api/v1/files/{id}/download',
        description: '文件下载接口',
        status: 'planned',
        priority: 'MEDIUM',
      },
    ],
  }

  return endpointMap[moduleName] || []
}

function getTasksForModule(moduleName: string, moduleId: string, status: string) {
  const taskMap: Record<string, any[]> = {
    '用户管理': [
      {
        moduleId,
        title: '设计用户数据模型',
        description: '设计用户表结构，包括基本信息、认证信息等',
        type: 'DEVELOPMENT',
        status: 'COMPLETED',
        priority: 'HIGH',
        estimatedHours: 4,
        actualHours: 3,
        completedAt: new Date('2024-01-02'),
        sortOrder: 1,
      },
      {
        moduleId,
        title: '实现用户注册功能',
        description: '实现用户注册接口，包括数据验证、密码加密等',
        type: 'DEVELOPMENT',
        status: 'COMPLETED',
        priority: 'HIGH',
        estimatedHours: 8,
        actualHours: 10,
        completedAt: new Date('2024-01-05'),
        sortOrder: 2,
      },
      {
        moduleId,
        title: '编写单元测试',
        description: '为用户管理模块编写完整的单元测试',
        type: 'TESTING',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        estimatedHours: 6,
        actualHours: 8,
        completedAt: new Date('2024-01-12'),
        sortOrder: 3,
      },
    ],
    '权限管理': [
      {
        moduleId,
        title: '设计RBAC权限模型',
        description: '设计基于角色的权限控制模型',
        type: 'DEVELOPMENT',
        status: 'COMPLETED',
        priority: 'HIGH',
        estimatedHours: 12,
        actualHours: 15,
        completedAt: new Date('2024-01-20'),
        sortOrder: 1,
      },
      {
        moduleId,
        title: '实现角色管理',
        description: '实现角色的增删改查功能',
        type: 'DEVELOPMENT',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        estimatedHours: 16,
        actualHours: 10,
        sortOrder: 2,
      },
      {
        moduleId,
        title: '权限中间件开发',
        description: '开发权限检查中间件',
        type: 'DEVELOPMENT',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 8,
        sortOrder: 3,
      },
    ],
    '文件管理': [
      {
        moduleId,
        title: '文件存储方案设计',
        description: '设计文件存储架构，选择存储服务',
        type: 'DEVELOPMENT',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 6,
        sortOrder: 1,
      },
      {
        moduleId,
        title: '文件上传接口',
        description: '实现文件上传功能',
        type: 'DEVELOPMENT',
        status: 'TODO',
        priority: 'HIGH',
        estimatedHours: 12,
        sortOrder: 2,
      },
    ],
  }

  return taskMap[moduleName] || []
}

function getDocsForModule(moduleName: string, moduleId: string) {
  const docMap: Record<string, any[]> = {
    '用户管理': [
      {
        moduleId,
        title: '用户管理模块设计文档',
        content: '# 用户管理模块\n\n## 概述\n用户管理模块负责处理用户的注册、登录、认证等核心功能。\n\n## 功能特性\n- 用户注册\n- 用户登录\n- JWT认证\n- 密码重置\n\n## API接口\n详见API文档...',
        type: 'SPECIFICATION',
        format: 'markdown',
        isPublic: true,
        sortOrder: 1,
        createdBy: 'system',
      },
      {
        moduleId,
        title: '用户认证流程',
        content: '# 用户认证流程\n\n## JWT认证\n本系统使用JWT(JSON Web Token)进行用户认证...',
        type: 'TECHNICAL_DOC',
        format: 'markdown',
        isPublic: false,
        sortOrder: 2,
        createdBy: 'system',
      },
    ],
    '权限管理': [
      {
        moduleId,
        title: 'RBAC权限模型设计',
        content: '# RBAC权限模型\n\n## 角色权限控制\n基于角色的访问控制(RBAC)是一种广泛使用的权限管理模式...',
        type: 'SPECIFICATION',
        format: 'markdown',
        isPublic: true,
        sortOrder: 1,
        createdBy: 'system',
      },
    ],
  }

  return docMap[moduleName] || []
}

// 如果直接运行此脚本
if (require.main === module) {
  seedFeatures()
    .then(() => {
      console.log('种子数据添加完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('种子数据添加失败:', error)
      process.exit(1)
    })
}

export { seedFeatures }