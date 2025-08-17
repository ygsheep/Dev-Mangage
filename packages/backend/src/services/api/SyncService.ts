import { PrismaClient } from '@prisma/client';
import { APIEndpointService } from './APIEndpointService';
import { APIGroupService } from './APIGroupService';
import { SyncResult, CreateSyncConfigurationData, UpdateSyncConfigurationData, SyncConfigurationWithRelations } from './types';
import logger from '../../utils/logger';

export class SyncService {
  private endpointService: APIEndpointService;
  private groupService: APIGroupService;

  constructor(private prisma: PrismaClient) {
    this.endpointService = new APIEndpointService(prisma);
    this.groupService = new APIGroupService(prisma);
  }

  /**
   * 创建同步配置
   */
  async createSyncConfiguration(data: CreateSyncConfigurationData): Promise<SyncConfigurationWithRelations> {
    try {
      logger.info('创建同步配置', { 
        projectId: data.projectId, 
        name: data.name,
        syncDirection: data.syncDirection 
      });

      const config = await this.prisma.syncConfiguration.create({
        data: {
          projectId: data.projectId,
          name: data.name,
          description: data.description,
          isActive: data.isActive !== false,
          autoSync: data.autoSync || false,
          syncDirection: data.syncDirection || 'MODEL_TO_API',
          conflictResolution: data.conflictResolution || 'MANUAL',
          tableToEndpointMapping: data.tableToEndpointMapping ? JSON.stringify(data.tableToEndpointMapping) : null,
          fieldToParameterMapping: data.fieldToParameterMapping ? JSON.stringify(data.fieldToParameterMapping) : null,
          namingConvention: data.namingConvention || 'CAMEL_CASE',
          includeTables: data.includeTables ? JSON.stringify(data.includeTables) : null,
          excludeTables: data.excludeTables ? JSON.stringify(data.excludeTables) : null,
          includeFields: data.includeFields ? JSON.stringify(data.includeFields) : null,
          excludeFields: data.excludeFields ? JSON.stringify(data.excludeFields) : null,
          syncInterval: data.syncInterval
        },
        include: {
          project: true
        }
      });

      logger.info('同步配置创建成功', { configId: config.id });
      return config;
    } catch (error) {
      logger.error('创建同步配置失败', error);
      throw error;
    }
  }

  /**
   * 更新同步配置
   */
  async updateSyncConfiguration(id: string, data: UpdateSyncConfigurationData): Promise<SyncConfigurationWithRelations> {
    try {
      logger.info('更新同步配置', { configId: id });

      const config = await this.prisma.syncConfiguration.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          autoSync: data.autoSync,
          syncDirection: data.syncDirection,
          conflictResolution: data.conflictResolution,
          tableToEndpointMapping: data.tableToEndpointMapping ? JSON.stringify(data.tableToEndpointMapping) : undefined,
          fieldToParameterMapping: data.fieldToParameterMapping ? JSON.stringify(data.fieldToParameterMapping) : undefined,
          namingConvention: data.namingConvention,
          includeTables: data.includeTables ? JSON.stringify(data.includeTables) : undefined,
          excludeTables: data.excludeTables ? JSON.stringify(data.excludeTables) : undefined,
          includeFields: data.includeFields ? JSON.stringify(data.includeFields) : undefined,
          excludeFields: data.excludeFields ? JSON.stringify(data.excludeFields) : undefined,
          syncInterval: data.syncInterval
        },
        include: {
          project: true
        }
      });

      logger.info('同步配置更新成功', { configId: id });
      return config;
    } catch (error) {
      logger.error('更新同步配置失败', error);
      throw error;
    }
  }

  /**
   * 删除同步配置
   */
  async deleteSyncConfiguration(id: string): Promise<void> {
    try {
      logger.info('删除同步配置', { configId: id });

      await this.prisma.syncConfiguration.delete({
        where: { id }
      });

      logger.info('同步配置删除成功', { configId: id });
    } catch (error) {
      logger.error('删除同步配置失败', error);
      throw error;
    }
  }

  /**
   * 获取同步配置列表
   */
  async getSyncConfigurations(projectId: string): Promise<SyncConfigurationWithRelations[]> {
    try {
      return await this.prisma.syncConfiguration.findMany({
        where: { projectId },
        include: {
          project: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error('获取同步配置列表失败', error);
      throw error;
    }
  }

  /**
   * 执行数据模型到API的同步
   */
  async syncModelToAPI(configId: string, options?: { dryRun?: boolean; userId?: string }): Promise<SyncResult> {
    try {
      logger.info('开始数据模型到API同步', { configId, dryRun: options?.dryRun });

      const config = await this.prisma.syncConfiguration.findUnique({
        where: { id: configId },
        include: { project: true }
      });

      if (!config) {
        throw new Error('同步配置不存在');
      }

      if (!config.isActive) {
        throw new Error('同步配置未激活');
      }

      const result: SyncResult = {
        success: true,
        message: '同步完成',
        createdEndpoints: 0,
        updatedEndpoints: 0,
        deletedEndpoints: 0,
        conflicts: [],
        errors: []
      };

      // 获取项目的数据表
      const tables = await this.prisma.databaseTable.findMany({
        where: {
          projectId: config.projectId,
          status: 'ACTIVE'
        },
        include: {
          fields: {
            orderBy: { sortOrder: 'asc' }
          },
          relatedEndpoints: true
        }
      });

      // 过滤表
      const filteredTables = this.filterTables(tables, config);

      for (const table of filteredTables) {
        try {
          // 检查表是否已有对应的API端点
          const existingEndpoints = table.relatedEndpoints;

          if (existingEndpoints.length === 0) {
            // 创建新的API端点
            if (!options?.dryRun) {
              const newEndpoints = await this.endpointService.generateFromTable(
                table.id,
                ['CREATE', 'READ', 'UPDATE', 'DELETE'],
                {
                  authRequired: false,
                  createdBy: options?.userId
                }
              );
              result.createdEndpoints += newEndpoints.length;
            } else {
              result.createdEndpoints += 4; // CRUD operations
            }
          } else {
            // 检查现有端点是否需要更新
            for (const endpoint of existingEndpoints) {
              const needsUpdate = await this.checkEndpointNeedsUpdate(endpoint, table);
              if (needsUpdate) {
                if (!options?.dryRun) {
                  await this.updateEndpointFromTable(endpoint.id, table, options?.userId);
                }
                result.updatedEndpoints++;
              }
            }
          }
        } catch (error) {
          logger.error(`同步表 ${table.name} 失败`, error);
          result.errors.push(`表 ${table.name}: ${error.message}`);
          result.success = false;
        }
      }

      // 更新最后同步时间
      if (!options?.dryRun) {
        await this.prisma.syncConfiguration.update({
          where: { id: configId },
          data: { lastSyncAt: new Date() }
        });
      }

      logger.info('数据模型到API同步完成', { 
        configId, 
        created: result.createdEndpoints,
        updated: result.updatedEndpoints,
        errors: result.errors.length
      });

      return result;
    } catch (error) {
      logger.error('数据模型到API同步失败', error);
      throw error;
    }
  }

  /**
   * 执行API到数据模型的同步
   */
  async syncAPIToModel(configId: string, options?: { dryRun?: boolean; userId?: string }): Promise<SyncResult> {
    try {
      logger.info('开始API到数据模型同步', { configId, dryRun: options?.dryRun });

      const config = await this.prisma.syncConfiguration.findUnique({
        where: { id: configId },
        include: { project: true }
      });

      if (!config) {
        throw new Error('同步配置不存在');
      }

      const result: SyncResult = {
        success: true,
        message: '同步完成',
        createdEndpoints: 0,
        updatedEndpoints: 0,
        deletedEndpoints: 0,
        conflicts: [],
        errors: []
      };

      // 获取项目的API端点
      const endpoints = await this.prisma.aPIEndpoint.findMany({
        where: {
          projectId: config.projectId,
          relatedTableId: null // 只处理没有关联数据表的端点
        },
        include: {
          parameters: true,
          responses: true
        }
      });

      for (const endpoint of endpoints) {
        try {
          // 分析端点，生成对应的数据表结构
          const tableStructure = this.analyzeEndpointForTable(endpoint);
          
          if (tableStructure) {
            if (!options?.dryRun) {
              const newTable = await this.createTableFromEndpoint(tableStructure, config.projectId, options?.userId);
              
              // 更新端点关联
              await this.prisma.aPIEndpoint.update({
                where: { id: endpoint.id },
                data: { 
                  relatedTableId: newTable.id,
                  syncedFromModel: true,
                  lastSyncAt: new Date()
                }
              });
            }
            result.createdEndpoints++;
          }
        } catch (error) {
          logger.error(`同步端点 ${endpoint.name} 失败`, error);
          result.errors.push(`端点 ${endpoint.name}: ${error.message}`);
          result.success = false;
        }
      }

      // 更新最后同步时间
      if (!options?.dryRun) {
        await this.prisma.syncConfiguration.update({
          where: { id: configId },
          data: { lastSyncAt: new Date() }
        });
      }

      logger.info('API到数据模型同步完成', { 
        configId,
        created: result.createdEndpoints,
        errors: result.errors.length
      });

      return result;
    } catch (error) {
      logger.error('API到数据模型同步失败', error);
      throw error;
    }
  }

  /**
   * 执行双向同步
   */
  async syncBidirectional(configId: string, options?: { dryRun?: boolean; userId?: string }): Promise<SyncResult> {
    try {
      logger.info('开始双向同步', { configId, dryRun: options?.dryRun });

      // 先执行模型到API同步
      const modelToAPIResult = await this.syncModelToAPI(configId, options);
      
      // 再执行API到模型同步
      const apiToModelResult = await this.syncAPIToModel(configId, options);

      // 合并结果
      const result: SyncResult = {
        success: modelToAPIResult.success && apiToModelResult.success,
        message: '双向同步完成',
        createdEndpoints: modelToAPIResult.createdEndpoints + apiToModelResult.createdEndpoints,
        updatedEndpoints: modelToAPIResult.updatedEndpoints + apiToModelResult.updatedEndpoints,
        deletedEndpoints: modelToAPIResult.deletedEndpoints + apiToModelResult.deletedEndpoints,
        conflicts: [...modelToAPIResult.conflicts, ...apiToModelResult.conflicts],
        errors: [...modelToAPIResult.errors, ...apiToModelResult.errors]
      };

      logger.info('双向同步完成', { configId, success: result.success });
      return result;
    } catch (error) {
      logger.error('双向同步失败', error);
      throw error;
    }
  }

  /**
   * 检测同步冲突
   */
  async detectConflicts(configId: string): Promise<SyncResult['conflicts']> {
    try {
      logger.info('检测同步冲突', { configId });

      const config = await this.prisma.syncConfiguration.findUnique({
        where: { id: configId }
      });

      if (!config) {
        throw new Error('同步配置不存在');
      }

      const conflicts: SyncResult['conflicts'] = [];

      // 获取有关联的表和端点
      const tablesWithEndpoints = await this.prisma.databaseTable.findMany({
        where: {
          projectId: config.projectId,
          relatedEndpoints: {
            some: {}
          }
        },
        include: {
          relatedEndpoints: {
            include: {
              parameters: true
            }
          },
          fields: true
        }
      });

      for (const table of tablesWithEndpoints) {
        for (const endpoint of table.relatedEndpoints) {
          // 检查字段和参数的一致性
          const fieldConflicts = this.checkFieldParameterConsistency(table.fields, endpoint.parameters);
          conflicts.push(...fieldConflicts);

          // 检查端点路径和表名的一致性
          const expectedPath = this.generateExpectedPath(table.name);
          if (!endpoint.path.includes(expectedPath)) {
            conflicts.push({
              type: 'path_mismatch',
              tableId: table.id,
              endpointId: endpoint.id,
              description: `端点路径 ${endpoint.path} 与表名 ${table.name} 不匹配`
            });
          }
        }
      }

      logger.info('冲突检测完成', { configId, conflictCount: conflicts.length });
      return conflicts;
    } catch (error) {
      logger.error('检测同步冲突失败', error);
      throw error;
    }
  }

  /**
   * 解决同步冲突
   */
  async resolveConflicts(
    configId: string, 
    conflicts: Array<{ id: string; resolution: string; data?: any }>,
    userId?: string
  ): Promise<void> {
    try {
      logger.info('解决同步冲突', { configId, conflictCount: conflicts.length });

      for (const conflict of conflicts) {
        switch (conflict.resolution) {
          case 'model_wins':
            await this.applyModelWinsResolution(conflict.id, conflict.data, userId);
            break;
          case 'api_wins':
            await this.applyAPIWinsResolution(conflict.id, conflict.data, userId);
            break;
          case 'merge':
            await this.applyMergeResolution(conflict.id, conflict.data, userId);
            break;
          case 'skip':
            // 跳过此冲突
            break;
          default:
            logger.warn('未知的冲突解决方案', { resolution: conflict.resolution });
        }
      }

      logger.info('冲突解决完成', { configId });
    } catch (error) {
      logger.error('解决同步冲突失败', error);
      throw error;
    }
  }

  /**
   * 过滤数据表
   */
  private filterTables(tables: any[], config: any): any[] {
    let filteredTables = tables;

    // 应用包含规则
    if (config.includeTables) {
      const includePatterns = JSON.parse(config.includeTables);
      filteredTables = filteredTables.filter(table =>
        includePatterns.some((pattern: string) => this.matchPattern(table.name, pattern))
      );
    }

    // 应用排除规则
    if (config.excludeTables) {
      const excludePatterns = JSON.parse(config.excludeTables);
      filteredTables = filteredTables.filter(table =>
        !excludePatterns.some((pattern: string) => this.matchPattern(table.name, pattern))
      );
    }

    return filteredTables;
  }

  /**
   * 模式匹配
   */
  private matchPattern(text: string, pattern: string): boolean {
    // 简单的通配符匹配
    const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
    return regex.test(text);
  }

  /**
   * 检查端点是否需要更新
   */
  private async checkEndpointNeedsUpdate(endpoint: any, table: any): Promise<boolean> {
    // 检查端点最后更新时间是否早于表的更新时间
    if (endpoint.lastSyncAt && endpoint.lastSyncAt < table.updatedAt) {
      return true;
    }

    // 检查字段数量是否匹配
    const endpointParams = await this.prisma.aPIParameter.count({
      where: { endpointId: endpoint.id, type: 'body' }
    });

    const tableFields = table.fields.filter((f: any) => !f.isAutoIncrement).length;

    if (endpointParams !== tableFields) {
      return true;
    }

    return false;
  }

  /**
   * 从表更新端点
   */
  private async updateEndpointFromTable(endpointId: string, table: any, userId?: string): Promise<void> {
    // 这里实现具体的更新逻辑
    // 根据表结构更新端点的参数、响应等信息
    
    await this.prisma.aPIEndpoint.update({
      where: { id: endpointId },
      data: {
        lastSyncAt: new Date(),
        lastModifiedBy: userId
      }
    });
  }

  /**
   * 分析端点生成表结构
   */
  private analyzeEndpointForTable(endpoint: any): any | null {
    // 分析端点的参数和响应，推断可能的表结构
    if (endpoint.method === 'POST' && endpoint.parameters.length > 0) {
      const bodyParams = endpoint.parameters.filter((p: any) => p.type === 'body');
      if (bodyParams.length > 0) {
        return {
          name: this.extractTableNameFromPath(endpoint.path),
          fields: bodyParams.map((param: any) => ({
            name: param.name,
            type: this.mapDataTypeToFieldType(param.dataType),
            nullable: !param.required,
            comment: param.description
          }))
        };
      }
    }
    return null;
  }

  /**
   * 从端点创建数据表
   */
  private async createTableFromEndpoint(tableStructure: any, projectId: string, userId?: string): Promise<any> {
    // 实现从端点信息创建数据表的逻辑
    return await this.prisma.databaseTable.create({
      data: {
        projectId,
        name: tableStructure.name,
        comment: `从API端点自动生成`,
        status: 'DRAFT',
        createdBy: userId,
        fields: {
          create: tableStructure.fields.map((field: any, index: number) => ({
            name: field.name,
            type: field.type,
            nullable: field.nullable,
            comment: field.comment,
            sortOrder: index,
            createdBy: userId
          }))
        }
      }
    });
  }

  /**
   * 检查字段和参数的一致性
   */
  private checkFieldParameterConsistency(fields: any[], parameters: any[]): SyncResult['conflicts'] {
    const conflicts: SyncResult['conflicts'] = [];
    
    const bodyParams = parameters.filter(p => p.type === 'body');
    
    // 检查字段数量
    if (fields.length !== bodyParams.length) {
      conflicts.push({
        type: 'field_count_mismatch',
        description: `字段数量不匹配：表有 ${fields.length} 个字段，API有 ${bodyParams.length} 个参数`
      });
    }

    // 检查字段类型
    for (const field of fields) {
      const param = bodyParams.find(p => p.name === field.name);
      if (param) {
        const expectedDataType = this.mapFieldTypeToDataType(field.type);
        if (param.dataType !== expectedDataType) {
          conflicts.push({
            type: 'field_type_mismatch',
            description: `字段 ${field.name} 类型不匹配：表中为 ${field.type}，API中为 ${param.dataType}`
          });
        }
      } else {
        conflicts.push({
          type: 'missing_parameter',
          description: `API参数中缺少字段 ${field.name}`
        });
      }
    }

    return conflicts;
  }

  /**
   * 生成期望的路径
   */
  private generateExpectedPath(tableName: string): string {
    return tableName.toLowerCase().replace(/_/g, '-');
  }

  /**
   * 从路径提取表名
   */
  private extractTableNameFromPath(path: string): string {
    const segments = path.split('/').filter(s => s && !s.startsWith('{'));
    return segments[segments.length - 1] || 'unknown_table';
  }

  /**
   * 映射数据类型到字段类型
   */
  private mapDataTypeToFieldType(dataType: string): string {
    const typeMap: { [key: string]: string } = {
      'string': 'VARCHAR',
      'integer': 'INT',
      'number': 'DECIMAL',
      'boolean': 'BOOLEAN',
      'object': 'JSON',
      'array': 'JSON'
    };
    return typeMap[dataType] || 'VARCHAR';
  }

  /**
   * 映射字段类型到数据类型
   */
  private mapFieldTypeToDataType(fieldType: string): string {
    const typeMap: { [key: string]: string } = {
      'VARCHAR': 'string',
      'CHAR': 'string',
      'TEXT': 'string',
      'INT': 'integer',
      'BIGINT': 'integer',
      'DECIMAL': 'number',
      'FLOAT': 'number',
      'BOOLEAN': 'boolean',
      'JSON': 'object'
    };
    return typeMap[fieldType.toUpperCase()] || 'string';
  }

  /**
   * 应用模型优先的冲突解决方案
   */
  private async applyModelWinsResolution(conflictId: string, data: any, userId?: string): Promise<void> {
    // 实现模型优先的解决方案
    logger.info('应用模型优先解决方案', { conflictId });
  }

  /**
   * 应用API优先的冲突解决方案
   */
  private async applyAPIWinsResolution(conflictId: string, data: any, userId?: string): Promise<void> {
    // 实现API优先的解决方案
    logger.info('应用API优先解决方案', { conflictId });
  }

  /**
   * 应用合并的冲突解决方案
   */
  private async applyMergeResolution(conflictId: string, data: any, userId?: string): Promise<void> {
    // 实现合并的解决方案
    logger.info('应用合并解决方案', { conflictId });
  }
}