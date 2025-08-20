/**
 * 项目搜索服务
 * 提供项目相关的搜索功能
 */
import Fuse from 'fuse.js';
import { SearchService, SearchResult, SearchOptions } from './base/SearchService.js';
import { getPrismaClient } from '../database/index.js';
import { logger, logPerformance } from '../utils/logger.js';
import { DatabaseError } from '../utils/errors.js';
import { config } from '../config/index.js';

/**
 * 项目数据接口
 */
interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  baseUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  // 统计信息
  _count: {
    apis: number;
    tags: number;
    databaseTables: number;
    apiEndpoints: number;
    featureModules: number;
    issues: number;
  };
}

/**
 * 项目搜索选项接口
 */
interface ProjectSearchOptions extends SearchOptions {
  /** 是否包含已归档项目 */
  includeArchived?: boolean;
  /** 状态过滤 */
  status?: string[];
  /** 创建时间范围 */
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  /** 是否包含统计信息 */
  includeStats?: boolean;
}

/**
 * 项目搜索服务类
 */
export class ProjectSearchService extends SearchService<ProjectData> {
  private fuseIndex: Fuse<ProjectData> | null = null;
  private projectsCache: ProjectData[] = [];

  constructor() {
    super('ProjectSearchService');
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    logger.info('🔍 初始化项目搜索服务...');
    
    try {
      await this.buildIndex();
      logger.info('✅ 项目搜索服务初始化完成');
    } catch (error) {
      logger.error('❌ 项目搜索服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 构建搜索索引
   */
  public async buildIndex(): Promise<void> {
    const cacheKey = 'projects-index';
    
    // 检查缓存
    if (!this.needsIndexUpdate()) {
      const cachedIndex = this.getCache(cacheKey);
      if (cachedIndex) {
        this.fuseIndex = cachedIndex.fuseIndex;
        this.projectsCache = cachedIndex.projects;
        logger.debug('使用缓存的项目搜索索引');
        return;
      }
    }

    try {
      const prisma = getPrismaClient();
      
      // 获取项目数据
      const projects = await prisma.project.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          baseUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              apis: true,
              tags: true,
              databaseTables: true,
              apiEndpoints: true,
              featureModules: true,
              issues: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      // 构建Fuse索引
      this.fuseIndex = new Fuse(projects, {
        keys: [
          { name: 'name', weight: 0.4 },
          { name: 'description', weight: 0.3 },
          { name: 'status', weight: 0.2 },
          { name: 'baseUrl', weight: 0.1 }
        ],
        threshold: config.search.fuseThreshold,
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 1,
        distance: 100,
        location: 0,
        ignoreLocation: false,
        ignoreFieldNorm: false
      });

      this.projectsCache = projects;
      
      // 缓存索引
      this.setCache(cacheKey, {
        fuseIndex: this.fuseIndex,
        projects: this.projectsCache
      });
      
      this.updateIndexTimestamp();
      logger.info(`✅ 项目搜索索引构建完成，包含 ${projects.length} 个项目`);
      
    } catch (error) {
      throw new DatabaseError('构建项目搜索索引失败', {
        originalError: error
      });
    }
  }

  /**
   * 搜索项目
   */
  public async search(
    query: string, 
    options: ProjectSearchOptions = {}
  ): Promise<SearchResult<ProjectData>[]> {
    return this.executeSearch(async () => {
      this.validateQuery(query);
      const validatedOptions = this.validateOptions(options);

      // 确保索引存在
      if (!this.fuseIndex) {
        await this.buildIndex();
      }

      if (!this.fuseIndex) {
        throw new DatabaseError('项目搜索索引未构建');
      }

      // 执行搜索
      const searchResults = this.fuseIndex.search(query, {
        limit: validatedOptions.limit! * 2 // 获取更多结果用于后续过滤
      });

      // 转换结果格式
      let results: SearchResult<ProjectData>[] = searchResults.map(result => ({
        item: result.item,
        score: 1 - (result.score || 0), // Fuse.js的score是距离，需要转换为相似度
        matches: result.matches?.map(match => match.key || '') || [],
        highlights: this.extractHighlights(result.matches || [])
      }));

      // 应用过滤条件
      results = this.applyFilters(results, options);

      // 格式化并返回结果
      return this.formatResults(results, validatedOptions);
    }, 'search');
  }

  /**
   * 获取搜索建议
   */
  public async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    return this.executeSearch(async () => {
      this.validateQuery(query);

      if (!this.fuseIndex) {
        await this.buildIndex();
      }

      // 获取匹配的项目名称作为建议
      const results = this.fuseIndex!.search(query, { limit: limit * 2 });
      
      // 提取项目名称和描述中的关键词
      const suggestions = new Set<string>();
      
      results.forEach(result => {
        const project = result.item;
        
        // 添加项目名称
        if (project.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(project.name);
        }
        
        // 从描述中提取相关词汇
        if (project.description) {
          const descWords = project.description
            .toLowerCase()
            .split(/\s+/)
            .filter(word => 
              word.length > 2 && 
              word.includes(query.toLowerCase()) &&
              !suggestions.has(word)
            );
          
          descWords.forEach(word => suggestions.add(word));
        }
      });

      return Array.from(suggestions).slice(0, limit);
    }, 'getSuggestions');
  }

  /**
   * 根据ID获取项目
   */
  public async getProjectById(id: string): Promise<ProjectData | null> {
    return this.executeSearch(async () => {
      const project = this.projectsCache.find(p => p.id === id);
      if (project) {
        return project;
      }

      // 从数据库获取
      try {
        const prisma = getPrismaClient();
        const dbProject = await prisma.project.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            baseUrl: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                apis: true,
                tags: true,
                databaseTables: true,
                apiEndpoints: true,
                featureModules: true,
                issues: true
              }
            }
          }
        });

        return dbProject;
      } catch (error) {
        throw new DatabaseError('获取项目失败', { projectId: id, originalError: error });
      }
    }, 'getProjectById');
  }

  /**
   * 获取最近更新的项目
   */
  public async getRecentProjects(limit: number = 10): Promise<ProjectData[]> {
    return this.executeSearch(async () => {
      if (this.projectsCache.length === 0) {
        await this.buildIndex();
      }

      return this.projectsCache
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, limit);
    }, 'getRecentProjects');
  }

  /**
   * 获取项目统计信息
   */
  public async getProjectStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalApis: number;
    totalTables: number;
    totalEndpoints: number;
    totalFeatures: number;
    totalIssues: number;
  }> {
    return this.executeSearch(async () => {
      if (this.projectsCache.length === 0) {
        await this.buildIndex();
      }

      const stats = {
        total: this.projectsCache.length,
        byStatus: {} as Record<string, number>,
        totalApis: 0,
        totalTables: 0,
        totalEndpoints: 0,
        totalFeatures: 0,
        totalIssues: 0
      };

      this.projectsCache.forEach(project => {
        // 统计状态分布
        stats.byStatus[project.status] = (stats.byStatus[project.status] || 0) + 1;
        
        // 累计各种资源数量
        stats.totalApis += project._count.apis;
        stats.totalTables += project._count.databaseTables;
        stats.totalEndpoints += project._count.apiEndpoints;
        stats.totalFeatures += project._count.featureModules;
        stats.totalIssues += project._count.issues;
      });

      return stats;
    }, 'getProjectStats');
  }

  /**
   * 应用过滤条件
   */
  private applyFilters(
    results: SearchResult<ProjectData>[], 
    options: ProjectSearchOptions
  ): SearchResult<ProjectData>[] {
    let filtered = results;

    // 状态过滤
    if (options.status && options.status.length > 0) {
      filtered = filtered.filter(result => 
        options.status!.includes(result.item.status)
      );
    }

    // 归档状态过滤
    if (!options.includeArchived) {
      filtered = filtered.filter(result => 
        result.item.status !== 'ARCHIVED'
      );
    }

    // 日期范围过滤
    if (options.dateRange) {
      filtered = filtered.filter(result => {
        const projectDate = result.item.createdAt;
        const { from, to } = options.dateRange!;
        
        if (from && projectDate < from) return false;
        if (to && projectDate > to) return false;
        
        return true;
      });
    }

    return filtered;
  }

  /**
   * 提取高亮信息
   */
  private extractHighlights(matches: readonly any[]): Record<string, string[]> {
    const highlights: Record<string, string[]> = {};
    
    Array.from(matches).forEach(match => {
      if (match.key && match.indices) {
        highlights[match.key] = match.indices.map((indices: number[]) => {
          const [start, end] = indices;
          return match.value.substring(start, end + 1);
        });
      }
    });

    return highlights;
  }

  /**
   * 刷新特定项目的缓存
   */
  public async refreshProject(projectId: string): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          baseUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              apis: true,
              tags: true,
              databaseTables: true,
              apiEndpoints: true,
              featureModules: true,
              issues: true
            }
          }
        }
      });

      if (project) {
        // 更新缓存中的项目
        const index = this.projectsCache.findIndex(p => p.id === projectId);
        if (index >= 0) {
          this.projectsCache[index] = project;
        } else {
          this.projectsCache.push(project);
        }

        // 重建索引
        await this.buildIndex();
        
        logger.debug(`项目 ${projectId} 缓存已刷新`);
      }
    } catch (error) {
      logger.error(`刷新项目 ${projectId} 缓存失败:`, error);
      throw new DatabaseError('刷新项目缓存失败', { projectId, originalError: error });
    }
  }
}

/**
 * 导出项目搜索服务单例
 */
export const projectSearchService = new ProjectSearchService();