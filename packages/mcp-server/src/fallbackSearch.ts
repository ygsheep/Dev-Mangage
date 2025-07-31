/**
 * 回退向量搜索实现
 * 当无法下载预训练模型时，使用简化的向量化方法
 */

interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

interface SearchResult {
  document: Document;
  score: number;
}

export class FallbackVectorSearchService {
  private documents: Document[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    console.log('🔄 初始化回退向量搜索服务...');
    this.isInitialized = true;
    console.log('✅ 回退向量搜索服务已就绪 (基于TF-IDF + 余弦相似度)');
  }

  async addDocument(doc: Document): Promise<void> {
    const existingIndex = this.documents.findIndex(d => d.id === doc.id);
    
    if (existingIndex >= 0) {
      this.documents[existingIndex] = doc;
    } else {
      this.documents.push(doc);
    }
  }

  async addDocuments(docs: Document[]): Promise<void> {
    for (const doc of docs) {
      await this.addDocument(doc);
    }
  }

  async search(query: string, limit: number = 10, threshold: number = 0.1): Promise<SearchResult[]> {
    if (!this.isInitialized || this.documents.length === 0) {
      return [];
    }

    // 简化的TF-IDF向量化
    const queryVector = this.textToVector(query);
    const results: SearchResult[] = [];

    for (const doc of this.documents) {
      const docVector = this.textToVector(doc.content);
      const similarity = this.cosineSimilarity(queryVector, docVector);
      
      if (similarity >= threshold) {
        results.push({
          document: doc,
          score: similarity
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async hybridSearch(
    query: string, 
    fuzzyResults: any[], 
    limit: number = 10,
    vectorWeight: number = 0.6,
    fuzzyWeight: number = 0.4
  ): Promise<any[]> {
    // 执行向量搜索
    const vectorResults = await this.search(query, limit * 2);
    
    // 创建混合评分映射
    const scoreMap = new Map<string, { document: any; vectorScore: number; fuzzyScore: number }>();
    
    // 添加向量搜索结果
    vectorResults.forEach(result => {
      scoreMap.set(result.document.id, {
        document: result.document.metadata,
        vectorScore: result.score,
        fuzzyScore: 0
      });
    });
    
    // 添加模糊搜索结果并合并分数
    fuzzyResults.forEach(result => {
      const id = result.item?.id || result.id;
      const fuzzyScore = 1 - (result.score || 0); // Fuse.js分数越低越好，需要反转
      
      if (scoreMap.has(id)) {
        scoreMap.get(id)!.fuzzyScore = fuzzyScore;
      } else {
        scoreMap.set(id, {
          document: result.item || result,
          vectorScore: 0,
          fuzzyScore
        });
      }
    });
    
    // 计算混合分数并返回结果
    const hybridResults = Array.from(scoreMap.values())
      .map(item => ({
        ...item.document,
        hybridScore: (item.vectorScore * vectorWeight) + (item.fuzzyScore * fuzzyWeight),
        vectorScore: item.vectorScore,
        fuzzyScore: item.fuzzyScore
      }))
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, limit);
    
    return hybridResults;
  }

  async buildSearchIndex(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('🔄 构建回退向量搜索索引...');
    
    try {
      const { prisma } = await import('@devapi/backend/prisma');
      
      const [projects, apis, tags] = await Promise.all([
        prisma.project.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
          },
        }),
        prisma.aPI.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            path: true,
            method: true,
            parameters: true,
            responses: true,
            status: true,
            projectId: true,
          },
        }),
        prisma.tag.findMany({
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        }),
      ]);

      // 准备文档数据
      const documents: Document[] = [];

      // 添加项目文档
      projects.forEach(project => {
        documents.push({
          id: `project-${project.id}`,
          content: `${project.name} ${project.description || ''}`.trim(),
          metadata: { ...project, type: 'project' }
        });
      });

      // 添加API文档（重点优化API搜索）
      apis.forEach(api => {
        const content = [
          api.name,                    // API名称权重最高
          `${api.method} ${api.path}`, // HTTP方法和路径
          api.description || '',       // 描述
          api.parameters || '',        // 参数
          api.responses || ''          // 响应
        ].filter(Boolean).join(' ');

        documents.push({
          id: `api-${api.id}`,
          content,
          metadata: { ...api, type: 'api' }
        });
      });

      // 添加标签文档
      tags.forEach(tag => {
        documents.push({
          id: `tag-${tag.id}`,
          content: tag.name,
          metadata: { ...tag, type: 'tag' }
        });
      });

      // 批量添加文档到索引
      await this.addDocuments(documents);
      
      console.log(`✅ 回退向量搜索索引构建完成，包含 ${documents.length} 个文档`);
    } catch (error) {
      console.error('❌ 构建回退向量搜索索引失败:', error);
      throw error;
    }
  }

  private textToVector(text: string): Map<string, number> {
    const words = this.tokenize(text.toLowerCase());
    const vector = new Map<string, number>();
    
    // 计算词频
    words.forEach(word => {
      vector.set(word, (vector.get(word) || 0) + 1);
    });
    
    // 应用权重（API相关词汇加权）
    const apiKeywords = ['api', 'get', 'post', 'put', 'delete', 'patch', 'endpoint', 'request', 'response', 'parameter', 'auth', 'user', 'data'];
    
    for (const [word, freq] of vector.entries()) {
      if (apiKeywords.includes(word)) {
        vector.set(word, freq * 1.5); // API关键词加权
      }
    }
    
    return vector;
  }

  private tokenize(text: string): string[] {
    // 改进的分词，处理API路径和技术术语
    return text
      .replace(/[\/\-_\.]/g, ' ') // 将路径分隔符替换为空格
      .replace(/([a-z])([A-Z])/g, '$1 $2') // 处理驼峰命名
      .split(/\s+/)
      .filter(word => word.length > 1)
      .filter(word => !this.isStopWord(word));
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]);
    return stopWords.has(word);
  }

  private cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
    const allKeys = new Set([...vecA.keys(), ...vecB.keys()]);
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (const key of allKeys) {
      const a = vecA.get(key) || 0;
      const b = vecB.get(key) || 0;
      
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (normA * normB);
  }

  getStats(): { documentCount: number; isInitialized: boolean } {
    return {
      documentCount: this.documents.length,
      isInitialized: this.isInitialized
    };
  }
}

// 导出单例实例
export const fallbackVectorSearchService = new FallbackVectorSearchService();