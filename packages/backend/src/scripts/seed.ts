import { PrismaClient } from '@prisma/client'
import { ProjectStatus, APIStatus, HTTPMethod } from '@devapi/shared'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  try {
    // Clean existing data
    await prisma.aPITag.deleteMany()
    await prisma.aPIEndpoint.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.project.deleteMany()

    // Create sample projects
    const project1 = await prisma.project.create({
      data: {
        name: 'DevAPI Manager',
        description: 'API聚合和项目管理工具',
        status: ProjectStatus.ACTIVE,
      },
    })

    const project2 = await prisma.project.create({
      data: {
        name: 'E-commerce Platform',
        description: '电子商务平台API',
        status: ProjectStatus.ACTIVE,
      },
    })

    console.log('✅ Created projects')

    // Create sample tags
    const tags1 = await Promise.all([
      prisma.tag.create({
        data: {
          name: '用户管理',
          color: '#3B82F6',
          projectId: project1.id,
        },
      }),
      prisma.tag.create({
        data: {
          name: '项目管理',
          color: '#10B981',
          projectId: project1.id,
        },
      }),
      prisma.tag.create({
        data: {
          name: 'API管理',
          color: '#F59E0B',
          projectId: project1.id,
        },
      }),
    ])

    const tags2 = await Promise.all([
      prisma.tag.create({
        data: {
          name: '商品管理',
          color: '#EF4444',
          projectId: project2.id,
        },
      }),
      prisma.tag.create({
        data: {
          name: '订单管理',
          color: '#8B5CF6',
          projectId: project2.id,
        },
      }),
      prisma.tag.create({
        data: {
          name: '支付系统',
          color: '#06B6D4',
          projectId: project2.id,
        },
      }),
    ])

    console.log('✅ Created tags')

    // Create sample APIs for project 1
    const apis1 = await Promise.all([
      prisma.aPIEndpoint.create({
        data: {
          name: '获取项目列表',
          method: HTTPMethod.GET,
          path: '/api/v1/projects',
          description: '获取所有项目的列表',
          status: APIStatus.COMPLETED,
          projectId: project1.id,
          frontendCode: `// 获取项目列表
import axios from 'axios'

export const getProjects = async (params?: any) => {
  const response = await axios.get('/api/v1/projects', { params })
  return response.data
}`,
          backendCode: `// 获取项目列表
router.get('/projects', async (req, res) => {
  const projects = await prisma.project.findMany()
  res.json({ success: true, data: projects })
})`,
        },
      }),
      prisma.aPIEndpoint.create({
        data: {
          name: '创建新项目',
          method: HTTPMethod.POST,
          path: '/api/v1/projects',
          description: '创建一个新的项目',
          status: APIStatus.IN_PROGRESS,
          projectId: project1.id,
        },
      }),
      prisma.aPIEndpoint.create({
        data: {
          name: '获取API列表',
          method: HTTPMethod.GET,
          path: '/api/v1/apis',
          description: '获取指定项目的API列表',
          status: APIStatus.NOT_TESTED,
          projectId: project1.id,
        },
      }),
    ])

    // Create sample APIs for project 2
    const apis2 = await Promise.all([
      prisma.aPIEndpoint.create({
        data: {
          name: '获取商品列表',
          method: HTTPMethod.GET,
          path: '/api/v1/products',
          description: '获取所有商品的列表',
          status: APIStatus.TESTED,
          projectId: project2.id,
        },
      }),
      prisma.aPIEndpoint.create({
        data: {
          name: '创建订单',
          method: HTTPMethod.POST,
          path: '/api/v1/orders',
          description: '创建新的订单',
          status: APIStatus.COMPLETED,
          projectId: project2.id,
        },
      }),
      prisma.aPIEndpoint.create({
        data: {
          name: '处理支付',
          method: HTTPMethod.POST,
          path: '/api/v1/payments',
          description: '处理订单支付',
          status: APIStatus.IN_PROGRESS,
          projectId: project2.id,
        },
      }),
    ])

    console.log('✅ Created APIs')

    // Create API-Tag relationships
    await Promise.all([
      // Project 1 API tags
      prisma.aPITag.create({
        data: { apiId: apis1[0].id, tagId: tags1[1].id }, // 获取项目列表 -> 项目管理
      }),
      prisma.aPITag.create({
        data: { apiId: apis1[1].id, tagId: tags1[1].id }, // 创建新项目 -> 项目管理
      }),
      prisma.aPITag.create({
        data: { apiId: apis1[2].id, tagId: tags1[2].id }, // 获取API列表 -> API管理
      }),

      // Project 2 API tags
      prisma.aPITag.create({
        data: { apiId: apis2[0].id, tagId: tags2[0].id }, // 获取商品列表 -> 商品管理
      }),
      prisma.aPITag.create({
        data: { apiId: apis2[1].id, tagId: tags2[1].id }, // 创建订单 -> 订单管理
      }),
      prisma.aPITag.create({
        data: { apiId: apis2[2].id, tagId: tags2[2].id }, // 处理支付 -> 支付系统
      }),
    ])

    console.log('✅ Created API-Tag relationships')

    // Print summary
    const totalProjects = await prisma.project.count()
    const totalAPIs = await prisma.aPIEndpoint.count()
    const totalTags = await prisma.tag.count()

    console.log('\n📊 Seed completed successfully!')
    console.log(`   • Projects: ${totalProjects}`)
    console.log(`   • APIs: ${totalAPIs}`)
    console.log(`   • Tags: ${totalTags}`)
    console.log('\n🚀 You can now start the development server!')

  } catch (error) {
    console.error('❌ Error during seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })