import { PrismaClient } from '@prisma/client';
import { CreateAPIGroupData, UpdateAPIGroupData, APIGroupWithRelations } from './types';
import logger from '../../utils/logger';

export class APIGroupService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 创建API分组
   */
  async createGroup(data: CreateAPIGroupData): Promise<APIGroupWithRelations> {
    try {
      logger.info('创建API分组', { 
        projectId: data.projectId, 
        name: data.name,
        parentId: data.parentId 
      });

      // 检查同级分组名称是否重复
      const existingGroup = await this.prisma.aPIGroup.findFirst({
        where: {
          projectId: data.projectId,
          name: data.name,
          parentId: data.parentId || null
        }
      });

      if (existingGroup) {
        throw new Error('同级分组中已存在相同名称的分组');
      }

      // 如果有父分组，验证父分组存在
      if (data.parentId) {
        const parentGroup = await this.prisma.aPIGroup.findUnique({
          where: { id: data.parentId }
        });

        if (!parentGroup) {
          throw new Error('父分组不存在');
        }

        if (parentGroup.projectId !== data.projectId) {
          throw new Error('父分组必须属于同一项目');
        }
      }

      const group = await this.prisma.aPIGroup.create({
        data: {
          projectId: data.projectId,
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          prefix: data.prefix,
          color: data.color || '#3B82F6',
          icon: data.icon,
          sortOrder: data.sortOrder || 0,
          parentId: data.parentId,
          status: data.status || 'ACTIVE'
        },
        include: {
          project: true,
          parent: true,
          children: {
            orderBy: { sortOrder: 'asc' }
          },
          endpoints: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      });

      logger.info('API分组创建成功', { groupId: group.id });
      return group;
    } catch (error) {
      logger.error('创建API分组失败', error);
      throw error;
    }
  }

  /**
   * 更新API分组
   */
  async updateGroup(id: string, data: UpdateAPIGroupData): Promise<APIGroupWithRelations> {
    try {
      logger.info('更新API分组', { groupId: id });

      const existingGroup = await this.prisma.aPIGroup.findUnique({
        where: { id }
      });

      if (!existingGroup) {
        throw new Error('API分组不存在');
      }

      // 如果更新名称，检查同级分组名称是否重复
      if (data.name && data.name !== existingGroup.name) {
        const duplicateGroup = await this.prisma.aPIGroup.findFirst({
          where: {
            projectId: existingGroup.projectId,
            name: data.name,
            parentId: data.parentId !== undefined ? data.parentId : existingGroup.parentId,
            id: { not: id }
          }
        });

        if (duplicateGroup) {
          throw new Error('同级分组中已存在相同名称的分组');
        }
      }

      // 如果更新父分组，验证不会造成循环引用
      if (data.parentId !== undefined && data.parentId !== existingGroup.parentId) {
        if (data.parentId) {
          const isCircular = await this.checkCircularReference(id, data.parentId);
          if (isCircular) {
            throw new Error('不能将分组设置为其子分组的父分组');
          }

          const parentGroup = await this.prisma.aPIGroup.findUnique({
            where: { id: data.parentId }
          });

          if (!parentGroup) {
            throw new Error('父分组不存在');
          }

          if (parentGroup.projectId !== existingGroup.projectId) {
            throw new Error('父分组必须属于同一项目');
          }
        }
      }

      const group = await this.prisma.aPIGroup.update({
        where: { id },
        data: {
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          prefix: data.prefix,
          color: data.color,
          icon: data.icon,
          sortOrder: data.sortOrder,
          parentId: data.parentId,
          status: data.status
        },
        include: {
          project: true,
          parent: true,
          children: {
            orderBy: { sortOrder: 'asc' }
          },
          endpoints: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      });

      logger.info('API分组更新成功', { groupId: id });
      return group;
    } catch (error) {
      logger.error('更新API分组失败', error);
      throw error;
    }
  }

  /**
   * 删除API分组
   */
  async deleteGroup(id: string, options?: { moveEndpointsToGroup?: string }): Promise<void> {
    try {
      logger.info('删除API分组', { groupId: id });

      const group = await this.prisma.aPIGroup.findUnique({
        where: { id },
        include: {
          children: true,
          endpoints: true
        }
      });

      if (!group) {
        throw new Error('API分组不存在');
      }

      // 检查是否有子分组
      if (group.children.length > 0) {
        throw new Error('请先删除所有子分组');
      }

      // 处理分组下的端点
      if (group.endpoints.length > 0) {
        if (options?.moveEndpointsToGroup) {
          // 移动端点到指定分组
          await this.prisma.aPIEndpoint.updateMany({
            where: { groupId: id },
            data: { groupId: options.moveEndpointsToGroup }
          });
        } else {
          // 将端点设置为未分组
          await this.prisma.aPIEndpoint.updateMany({
            where: { groupId: id },
            data: { groupId: null }
          });
        }
      }

      await this.prisma.aPIGroup.delete({
        where: { id }
      });

      logger.info('API分组删除成功', { groupId: id });
    } catch (error) {
      logger.error('删除API分组失败', error);
      throw error;
    }
  }

  /**
   * 获取API分组详情
   */
  async getGroupById(id: string): Promise<APIGroupWithRelations | null> {
    try {
      return await this.prisma.aPIGroup.findUnique({
        where: { id },
        include: {
          project: true,
          parent: true,
          children: {
            orderBy: { sortOrder: 'asc' }
          },
          endpoints: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      });
    } catch (error) {
      logger.error('获取API分组详情失败', error);
      throw error;
    }
  }

  /**
   * 获取项目的API分组列表（树形结构）
   */
  async getGroupsByProject(projectId: string): Promise<APIGroupWithRelations[]> {
    try {
      // 获取所有分组
      const allGroups = await this.prisma.aPIGroup.findMany({
        where: { 
          projectId,
          status: 'ACTIVE'
        },
        include: {
          project: true,
          parent: true,
          children: {
            orderBy: { sortOrder: 'asc' }
          },
          endpoints: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { sortOrder: 'asc' }
      });

      // 构建树形结构（返回根级分组）
      return allGroups.filter(group => !group.parentId);
    } catch (error) {
      logger.error('获取API分组列表失败', error);
      throw error;
    }
  }

  /**
   * 获取平铺的分组列表
   */
  async getFlatGroupsByProject(projectId: string): Promise<APIGroupWithRelations[]> {
    try {
      return await this.prisma.aPIGroup.findMany({
        where: { 
          projectId,
          status: 'ACTIVE'
        },
        include: {
          project: true,
          parent: true,
          children: {
            orderBy: { sortOrder: 'asc' }
          },
          endpoints: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: [
          { parentId: 'asc' },
          { sortOrder: 'asc' }
        ]
      });
    } catch (error) {
      logger.error('获取平铺分组列表失败', error);
      throw error;
    }
  }

  /**
   * 移动分组到新的父分组
   */
  async moveGroup(id: string, newParentId?: string): Promise<APIGroupWithRelations> {
    try {
      logger.info('移动API分组', { groupId: id, newParentId });

      const group = await this.prisma.aPIGroup.findUnique({
        where: { id }
      });

      if (!group) {
        throw new Error('API分组不存在');
      }

      // 验证新父分组
      if (newParentId) {
        // 检查循环引用
        const isCircular = await this.checkCircularReference(id, newParentId);
        if (isCircular) {
          throw new Error('不能将分组设置为其子分组的父分组');
        }

        const parentGroup = await this.prisma.aPIGroup.findUnique({
          where: { id: newParentId }
        });

        if (!parentGroup) {
          throw new Error('父分组不存在');
        }

        if (parentGroup.projectId !== group.projectId) {
          throw new Error('父分组必须属于同一项目');
        }
      }

      // 检查同级分组名称冲突
      const duplicateGroup = await this.prisma.aPIGroup.findFirst({
        where: {
          projectId: group.projectId,
          name: group.name,
          parentId: newParentId || null,
          id: { not: id }
        }
      });

      if (duplicateGroup) {
        throw new Error('目标位置已存在相同名称的分组');
      }

      return await this.updateGroup(id, { parentId: newParentId });
    } catch (error) {
      logger.error('移动API分组失败', error);
      throw error;
    }
  }

  /**
   * 调整分组排序
   */
  async reorderGroups(projectId: string, groupOrders: Array<{ id: string; sortOrder: number }>): Promise<void> {
    try {
      logger.info('调整API分组排序', { projectId, count: groupOrders.length });

      const updatePromises = groupOrders.map(({ id, sortOrder }) =>
        this.prisma.aPIGroup.update({
          where: { id },
          data: { sortOrder }
        })
      );

      await Promise.all(updatePromises);

      logger.info('API分组排序调整成功', { projectId });
    } catch (error) {
      logger.error('调整API分组排序失败', error);
      throw error;
    }
  }

  /**
   * 复制分组
   */
  async copyGroup(
    id: string, 
    targetProjectId?: string, 
    newName?: string,
    copyEndpoints = false
  ): Promise<APIGroupWithRelations> {
    try {
      logger.info('复制API分组', { groupId: id, targetProjectId, copyEndpoints });

      const sourceGroup = await this.prisma.aPIGroup.findUnique({
        where: { id },
        include: {
          endpoints: copyEndpoints
        }
      });

      if (!sourceGroup) {
        throw new Error('源分组不存在');
      }

      const projectId = targetProjectId || sourceGroup.projectId;
      const name = newName || `${sourceGroup.name}_copy`;

      // 检查目标项目中是否有同名分组
      const existingGroup = await this.prisma.aPIGroup.findFirst({
        where: {
          projectId,
          name,
          parentId: null // 复制的分组默认放在根级
        }
      });

      if (existingGroup) {
        throw new Error('目标位置已存在相同名称的分组');
      }

      const newGroup = await this.createGroup({
        projectId,
        name,
        displayName: sourceGroup.displayName,
        description: sourceGroup.description,
        prefix: sourceGroup.prefix,
        color: sourceGroup.color,
        icon: sourceGroup.icon,
        status: sourceGroup.status
      });

      // 如果需要复制端点
      if (copyEndpoints && sourceGroup.endpoints) {
        // TODO: 实现端点复制逻辑
        logger.info('端点复制功能待实现', { groupId: newGroup.id });
      }

      logger.info('API分组复制成功', { sourceId: id, newId: newGroup.id });
      return newGroup;
    } catch (error) {
      logger.error('复制API分组失败', error);
      throw error;
    }
  }

  /**
   * 获取分组的完整路径
   */
  async getGroupPath(id: string): Promise<string[]> {
    try {
      const path: string[] = [];
      let currentId = id;

      while (currentId) {
        const group = await this.prisma.aPIGroup.findUnique({
          where: { id: currentId },
          select: { name: true, parentId: true }
        });

        if (!group) break;

        path.unshift(group.name);
        currentId = group.parentId || '';
      }

      return path;
    } catch (error) {
      logger.error('获取分组路径失败', error);
      throw error;
    }
  }

  /**
   * 检查循环引用
   */
  private async checkCircularReference(groupId: string, potentialParentId: string): Promise<boolean> {
    try {
      let currentId = potentialParentId;

      while (currentId) {
        if (currentId === groupId) {
          return true; // 发现循环引用
        }

        const parent = await this.prisma.aPIGroup.findUnique({
          where: { id: currentId },
          select: { parentId: true }
        });

        if (!parent) break;
        currentId = parent.parentId || '';
      }

      return false;
    } catch (error) {
      logger.error('检查循环引用失败', error);
      return false;
    }
  }

  /**
   * 获取分组统计信息
   */
  async getGroupStatistics(id: string): Promise<{
    totalEndpoints: number;
    endpointsByStatus: Record<string, number>;
    endpointsByMethod: Record<string, number>;
    lastUpdated: Date | null;
  }> {
    try {
      const group = await this.prisma.aPIGroup.findUnique({
        where: { id },
        include: {
          endpoints: {
            select: {
              status: true,
              method: true,
              updatedAt: true
            }
          }
        }
      });

      if (!group) {
        throw new Error('API分组不存在');
      }

      const endpointsByStatus: Record<string, number> = {};
      const endpointsByMethod: Record<string, number> = {};
      let lastUpdated: Date | null = null;

      group.endpoints.forEach(endpoint => {
        // 统计状态
        endpointsByStatus[endpoint.status] = (endpointsByStatus[endpoint.status] || 0) + 1;
        
        // 统计方法
        endpointsByMethod[endpoint.method] = (endpointsByMethod[endpoint.method] || 0) + 1;
        
        // 获取最后更新时间
        if (!lastUpdated || endpoint.updatedAt > lastUpdated) {
          lastUpdated = endpoint.updatedAt;
        }
      });

      return {
        totalEndpoints: group.endpoints.length,
        endpointsByStatus,
        endpointsByMethod,
        lastUpdated
      };
    } catch (error) {
      logger.error('获取分组统计信息失败', error);
      throw error;
    }
  }
}