import { prisma } from '@devapi/backend/prisma';
import { vectorSearchService } from './vectorSearch.js';

interface APIContext {
  id: string;
  name: string;
  method: string;
  path: string;
  description?: string;
  parameters?: string;
  responses?: string;
  projectName: string;
  tags: string[];
  relatedAPIs?: string[];
}

interface RAGSearchResult {
  api: APIContext;
  relevanceScore: number;
  explanation: string;
  suggestions: string[];
}

export class APIRAGService {
  private apiContextCache: APIContext[] = [];
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10分钟缓存

  async buildAPIContext(): Promise<void> {
    console.log('构建API上下文数据...');
    
    const apis = await prisma.aPI.findMany({
      include: {
        project: {
          select: {
            name: true,
          },
        },
        apiTags: {
          include: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    this.apiContextCache = apis.map(api => ({
      id: api.id,
      name: api.name,
      method: api.method,
      path: api.path,
      description: api.description || '',
      parameters: api.parameters || '',
      responses: api.responses || '',
      projectName: api.project.name,
      tags: api.apiTags.map(at => at.tag.name),
      relatedAPIs: [], // 将在后续分析中填充
    }));

    // 分析相关API
    await this.analyzeRelatedAPIs();
    
    this.lastCacheUpdate = Date.now();
    console.log(`API上下文构建完成，包含 ${this.apiContextCache.length} 个API`);
  }

  private async analyzeRelatedAPIs(): Promise<void> {
    // 基于路径和标签分析相关API
    for (const api of this.apiContextCache) {
      const related = this.apiContextCache
        .filter(otherApi => otherApi.id !== api.id)
        .filter(otherApi => {
          // 相同项目
          if (otherApi.projectName !== api.projectName) return false;
          
          // 路径相似性
          const pathSimilarity = this.calculatePathSimilarity(api.path, otherApi.path);
          
          // 标签重叠
          const tagOverlap = api.tags.filter(tag => otherApi.tags.includes(tag)).length;
          
          return pathSimilarity > 0.3 || tagOverlap > 0;
        })
        .sort((a, b) => {
          const aScore = this.calculatePathSimilarity(api.path, a.path) + 
                        (api.tags.filter(tag => a.tags.includes(tag)).length * 0.2);
          const bScore = this.calculatePathSimilarity(api.path, b.path) + 
                        (api.tags.filter(tag => b.tags.includes(tag)).length * 0.2);
          return bScore - aScore;
        })
        .slice(0, 5)
        .map(a => a.id);

      api.relatedAPIs = related;
    }
  }

  private calculatePathSimilarity(path1: string, path2: string): number {
    const segments1 = path1.split('/').filter(s => s);
    const segments2 = path2.split('/').filter(s => s);
    
    let matchCount = 0;
    const minLength = Math.min(segments1.length, segments2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (segments1[i] === segments2[i] || 
          (segments1[i].startsWith('{') && segments2[i].startsWith('{'))) {
        matchCount++;
      }
    }
    
    return matchCount / Math.max(segments1.length, segments2.length);
  }

  async searchAPIs(
    query: string, 
    context?: {
      method?: string;
      projectId?: string;
      tags?: string[];
      includeRelated?: boolean;
    }
  ): Promise<RAGSearchResult[]> {
    await this.ensureCacheValid();
    
    // 过滤API
    let candidateAPIs = this.apiContextCache;
    
    if (context?.method) {
      candidateAPIs = candidateAPIs.filter(api => 
        api.method.toLowerCase() === context.method!.toLowerCase()
      );
    }
    
    if (context?.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: context.projectId },
        select: { name: true }
      });
      if (project) {
        candidateAPIs = candidateAPIs.filter(api => 
          api.projectName === project.name
        );
      }
    }
    
    if (context?.tags && context.tags.length > 0) {
      candidateAPIs = candidateAPIs.filter(api =>
        context.tags!.some(tag => api.tags.includes(tag))
      );
    }

    // 使用向量搜索进行语义匹配
    const vectorResults = await vectorSearchService.search(query, candidateAPIs.length);
    
    // 结合多种评分策略
    const results: RAGSearchResult[] = [];
    
    for (const api of candidateAPIs) {
      const vectorResult = vectorResults.find(vr => 
        vr.document.metadata.id === `api-${api.id}`
      );
      
      const vectorScore = vectorResult?.score || 0;
      const keywordScore = this.calculateKeywordScore(query, api);
      const contextScore = this.calculateContextScore(query, api);
      
      // 综合评分
      const relevanceScore = (vectorScore * 0.4) + (keywordScore * 0.3) + (contextScore * 0.3);
      
      if (relevanceScore > 0.1) { // 最低相关性阈值
        results.push({
          api,
          relevanceScore,
          explanation: this.generateExplanation(query, api, vectorScore, keywordScore, contextScore),
          suggestions: this.generateSuggestions(api, context?.includeRelated)
        });
      }
    }
    
    // 按相关性排序
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return results.slice(0, 10);
  }

  private calculateKeywordScore(query: string, api: APIContext): number {
    const queryLower = query.toLowerCase();
    const searchText = [
      api.name,
      api.path,
      api.description,
      api.parameters,
      api.responses,
      ...api.tags
    ].join(' ').toLowerCase();
    
    const words = queryLower.split(/\s+/);
    let score = 0;
    
    for (const word of words) {
      if (searchText.includes(word)) {
        score += 1;
      }
    }
    
    return Math.min(score / words.length, 1);
  }

  private calculateContextScore(query: string, api: APIContext): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // HTTP方法匹配
    const httpMethods = ['get', 'post', 'put', 'delete', 'patch'];
    for (const method of httpMethods) {
      if (queryLower.includes(method) && api.method.toLowerCase() === method) {
        score += 0.3;
      }
    }
    
    // 路径模式匹配
    if (queryLower.includes('list') && api.path.includes('/list')) score += 0.2;
    if (queryLower.includes('create') && (api.method === 'POST' || api.path.includes('/create'))) score += 0.2;
    if (queryLower.includes('update') && (api.method === 'PUT' || api.method === 'PATCH')) score += 0.2;
    if (queryLower.includes('delete') && api.method === 'DELETE') score += 0.2;
    
    return Math.min(score, 1);
  }

  private generateExplanation(
    query: string, 
    api: APIContext, 
    vectorScore: number, 
    keywordScore: number, 
    contextScore: number
  ): string {
    const explanations: string[] = [];
    
    if (vectorScore > 0.7) {
      explanations.push('语义相似度很高');
    } else if (vectorScore > 0.5) {
      explanations.push('语义相似度较高');
    }
    
    if (keywordScore > 0.7) {
      explanations.push('关键词匹配度很高');
    } else if (keywordScore > 0.5) {
      explanations.push('关键词匹配度较高');
    }
    
    if (contextScore > 0.5) {
      explanations.push('上下文匹配良好');
    }
    
    if (api.tags.length > 0) {
      explanations.push(`标签: ${api.tags.join(', ')}`);
    }
    
    return explanations.length > 0 ? explanations.join('，') : '基础匹配';
  }

  private generateSuggestions(api: APIContext, includeRelated = false): string[] {
    const suggestions: string[] = [];
    
    // 基于API特征的建议
    if (api.method === 'GET' && api.path.includes('/list')) {
      suggestions.push('这是一个列表查询接口，可能支持分页和过滤参数');
    }
    
    if (api.method === 'POST') {
      suggestions.push('这是一个创建或提交接口，请注意请求体格式');
    }
    
    if (api.method === 'PUT' || api.method === 'PATCH') {
      suggestions.push('这是一个更新接口，请确认必需的参数');
    }
    
    if (api.method === 'DELETE') {
      suggestions.push('这是一个删除接口，请谨慎使用');
    }
    
    // 相关API建议
    if (includeRelated && api.relatedAPIs && api.relatedAPIs.length > 0) {
      suggestions.push(`相关API: ${api.relatedAPIs.length} 个相关接口可供参考`);
    }
    
    return suggestions;
  }

  private async ensureCacheValid(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheUpdate > this.CACHE_TTL || this.apiContextCache.length === 0) {
      await this.buildAPIContext();
    }
  }

  async getAPIRecommendations(apiId: string, limit = 5): Promise<APIContext[]> {
    await this.ensureCacheValid();
    
    const targetAPI = this.apiContextCache.find(api => api.id === apiId);
    if (!targetAPI) return [];
    
    return this.apiContextCache
      .filter(api => targetAPI.relatedAPIs?.includes(api.id))
      .slice(0, limit);
  }

  async getAPIsByProject(projectName: string): Promise<APIContext[]> {
    await this.ensureCacheValid();
    return this.apiContextCache.filter(api => api.projectName === projectName);
  }

  getStats(): {
    totalAPIs: number;
    projectCount: number;
    averageTagsPerAPI: number;
    lastCacheUpdate: Date;
  } {
    const projectNames = new Set(this.apiContextCache.map(api => api.projectName));
    const totalTags = this.apiContextCache.reduce((sum, api) => sum + api.tags.length, 0);
    
    return {
      totalAPIs: this.apiContextCache.length,
      projectCount: projectNames.size,
      averageTagsPerAPI: this.apiContextCache.length > 0 ? totalTags / this.apiContextCache.length : 0,
      lastCacheUpdate: new Date(this.lastCacheUpdate)
    };
  }
}

// 导出单例实例
export const apiRAGService = new APIRAGService();