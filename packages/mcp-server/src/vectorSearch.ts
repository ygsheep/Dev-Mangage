import { pipeline, env } from '@xenova/transformers';
import * as fs from 'fs';
import * as path from 'path';
import { fallbackVectorSearchService } from './fallbackSearch.js';

// 配置transformers缓存目录
env.cacheDir = path.join(process.cwd(), '.cache', 'transformers');

// 配置镜像源
env.remoteHost = 'https://hf-mirror.com';
env.remotePathTemplate = '{model}/resolve/{revision}/';

// 配置网络超时和重试
env.allowRemoteModels = true; // 启用远程模型下载
env.allowLocalModels = true;

// 配置本地模型路径
const LOCAL_MODEL_PATH = path.join(process.cwd(), 'models');
const LOCAL_MODEL_FILE = path.join(LOCAL_MODEL_PATH, 'model_q4f16.onnx');

// 配置系统代理支持
function configureProxy() {
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  
  if (httpProxy || httpsProxy) {
    console.log('检测到代理配置:', { httpProxy, httpsProxy });
    // 设置全局代理（如果需要的话）
    if (typeof global !== 'undefined') {
      // @ts-ignore
      global.fetch = global.fetch || require('node-fetch');
    }
  }
}

configureProxy();

interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

interface SearchResult {
  document: Document;
  score: number;
}

export class VectorSearchService {
  private encoder: any = null;
  private documents: Document[] = [];
  private embeddings: number[][] = [];
  private isInitialized = false;
  private useFallback = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 初始化向量搜索服务...');
    
    // 直接使用回退方案，跳过模型下载
    console.log('⚠️  跳过模型下载，直接使用回退向量搜索');
    console.log('💡 回退方案使用 TF-IDF + 余弦相似度，专门为API搜索优化');
    
    this.useFallback = true;
    await fallbackVectorSearchService.initialize();
    this.isInitialized = true;
    return;
    
    // 原有的模型检查逻辑（暂时注释）
    const cacheModelDir = path.join(env.cacheDir!, 'Xenova', 'all-MiniLM-L6-v2');
    const requiredFiles = ['config.json', 'tokenizer.json', 'model_quantized.onnx'];
    const hasCompleteCache = false; // 强制跳过缓存检查
    
    if (hasCompleteCache) {
      console.log('🎯 检测到完整的本地缓存模型');
      console.log('📦 all-MiniLM-L6-v2 Q4F16量化版本 (28.6MB)');
      console.log('✅ 所有必需文件已就绪，启用完全离线模式');
      
      try {
        // 强制使用本地缓存的模型，不尝试网络下载
        this.encoder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
          quantized: true,
          // 不使用local_files_only，让它自动使用缓存目录的文件
          cache_dir: env.cacheDir
        });
        
        console.log(`✅ 本地向量模型加载成功`);
        console.log(`🚀 向量搜索服务已就绪 (离线模式)`);
        this.isInitialized = true;
        return;
      } catch (error) {
        console.warn(`❌ 本地模型加载失败: ${error}`);
        console.log('🔄 降级到网络模式或回退方案...');
      }
    }
    
    // 如果本地缓存不完整，尝试网络加载
    console.log('⚠️  本地缓存不完整，尝试网络下载模型...');
    
    // 重新启用网络模式进行模型下载
    env.allowRemoteModels = true;
    
    // 优化的模型选择策略 - 优先使用最适合API搜索的模型
    const modelOptions = [
      // 1. 首选：已经手动下载的最优模型
      { 
        name: 'Xenova/all-MiniLM-L6-v2', 
        description: '✨ 最优选择 - 轻量英文模型，专为API文档优化',
        size: '~23MB (对应本地的30MB Q4F16版本)',
        strengths: '代码、API路径、技术术语、高性能',
        priority: '🏆 首选 (匹配本地模型)'
      },
      
      // 2. 备选：多语言支持
      { 
        name: 'Xenova/multilingual-e5-small', 
        description: '多语言小模型 - 支持中英文混合内容',
        size: '~118MB',
        strengths: '中英文API描述、参数说明',
        priority: '🥈 备选'
      },
      
      // 3. 备选：更强理解能力
      { 
        name: 'Xenova/all-MiniLM-L12-v2', 
        description: '中等英文模型 - 更强语义理解',
        size: '~34MB',
        strengths: '复杂API文档、语义搜索',
        priority: '🥉 备选'
      }
    ];

    for (const model of modelOptions) {
      try {
        console.log(`\n🔄 尝试加载模型: ${model.name}`);
        console.log(`   ${model.priority || '📄'} 描述: ${model.description}`);
        console.log(`   📦 大小: ${model.size}`);
        console.log(`   🎯 优势: ${model.strengths}`);
        
        // 检查本地缓存
        const modelCachePath = path.join(env.cacheDir!, model.name);
        const isCached = fs.existsSync(modelCachePath);
        console.log(`   💾 缓存状态: ${isCached ? '已缓存' : '需下载'}`);
        
        this.encoder = await pipeline('feature-extraction', model.name, {
          quantized: true,
          progress_callback: (progress: any) => {
            if (progress.status === 'downloading') {
              const percent = Math.round(progress.progress || 0);
              const name = progress.name || 'unknown';
              console.log(`   📥 下载中: ${name} - ${percent}%`);
            } else if (progress.status === 'loading') {
              console.log(`   🔧 加载中: ${progress.name || 'model files'}`);
            }
          }
        });
        
        console.log(`✅ 向量编码器加载完成: ${model.name}`);
        console.log(`🚀 向量搜索服务已就绪`);
        this.isInitialized = true;
        return;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`❌ 模型 ${model.name} 加载失败: ${errorMsg}`);
        
        // 分析错误类型并给出建议
        if (errorMsg.includes('fetch failed') || errorMsg.includes('ECONNRESET')) {
          console.log(`   💡 建议: 检查网络连接或配置代理`);
          console.log(`   🔧 代理配置示例:`);
          console.log(`      set HTTP_PROXY=http://proxy:port`);
          console.log(`      set HTTPS_PROXY=https://proxy:port`);
        } else if (errorMsg.includes('ENOTFOUND')) {
          console.log(`   💡 建议: 检查DNS设置或使用镜像源`);
        }
        
        console.log(`🔄 尝试下一个模型...`);
      }
    }
    
    // 所有模型都失败了，切换到回退方案
    console.log('\n⚠️  所有预训练模型加载失败，切换到回退向量搜索');
    console.log('💡 回退方案使用 TF-IDF + 余弦相似度，专门为API搜索优化');
    
    this.useFallback = true;
    await fallbackVectorSearchService.initialize();
    this.isInitialized = true;
  }

  async addDocument(doc: Document): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('向量搜索服务未初始化');
    }

    if (this.useFallback) {
      return fallbackVectorSearchService.addDocument(doc);
    }

    if (!this.encoder) {
      throw new Error('向量编码器未初始化');
    }

    // 生成文档向量
    const embedding = await this.generateEmbedding(doc.content);
    
    // 检查是否已存在相同ID的文档
    const existingIndex = this.documents.findIndex(d => d.id === doc.id);
    
    if (existingIndex >= 0) {
      // 更新现有文档
      this.documents[existingIndex] = doc;
      this.embeddings[existingIndex] = embedding;
    } else {
      // 添加新文档
      this.documents.push(doc);
      this.embeddings.push(embedding);
    }
  }

  async addDocuments(docs: Document[]): Promise<void> {
    if (this.useFallback) {
      return fallbackVectorSearchService.addDocuments(docs);
    }
    
    for (const doc of docs) {
      await this.addDocument(doc);
    }
  }

  async search(query: string, limit: number = 10, threshold: number = 0.5): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      return [];
    }

    if (this.useFallback) {
      return fallbackVectorSearchService.search(query, limit, threshold);
    }

    if (!this.encoder || this.documents.length === 0) {
      return [];
    }

    // 生成查询向量
    const queryEmbedding = await this.generateEmbedding(query);
    
    // 计算相似度分数
    const scores = this.embeddings.map(embedding => 
      this.cosineSimilarity(queryEmbedding, embedding)
    );

    // 创建结果数组并排序
    const results: SearchResult[] = this.documents
      .map((doc, index) => ({
        document: doc,
        score: scores[index]
      }))
      .filter(result => result.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  async hybridSearch(
    query: string, 
    fuzzyResults: any[], 
    limit: number = 10,
    vectorWeight: number = 0.6,
    fuzzyWeight: number = 0.4
  ): Promise<any[]> {
    if (this.useFallback) {
      return fallbackVectorSearchService.hybridSearch(query, fuzzyResults, limit, vectorWeight, fuzzyWeight);
    }

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

  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.encoder) {
      throw new Error('编码器未初始化');
    }

    try {
      // 预处理文本：添加查询前缀以提高检索性能
      const processedText = `query: ${text}`;
      
      // 生成嵌入向量
      const output = await this.encoder(processedText, { pooling: 'mean', normalize: true });
      
      // 转换为普通数组
      return Array.from(output.data);
    } catch (error) {
      console.error('生成嵌入向量失败:', error);
      throw error;
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('向量维度不匹配');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  async buildSearchIndex(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.useFallback) {
      return fallbackVectorSearchService.buildSearchIndex();
    }

    console.log('🔄 开始构建向量搜索索引...');
    
    try {
      // 从数据库获取所有项目、API和标签数据
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
          content: `项目名称: ${project.name}${project.description ? `\n描述: ${project.description}` : ''}`,
          metadata: { ...project, type: 'project' }
        });
      });

      // 添加API文档
      apis.forEach(api => {
        const content = [
          `API名称: ${api.name}`,
          `请求方法: ${api.method}`,
          `路径: ${api.path}`,
          api.description ? `描述: ${api.description}` : '',
          api.parameters ? `参数: ${api.parameters}` : '',
          api.responses ? `响应: ${api.responses}` : ''
        ].filter(Boolean).join('\n');

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
          content: `标签名称: ${tag.name}`,
          metadata: { ...tag, type: 'tag' }
        });
      });

      // 批量添加文档到向量索引
      await this.addDocuments(documents);
      
      console.log(`✅ 向量搜索索引构建完成，包含 ${documents.length} 个文档`);
    } catch (error) {
      console.error('❌ 构建向量搜索索引失败:', error);
      throw error;
    }
  }

  getStats(): { documentCount: number; isInitialized: boolean; useFallback?: boolean } {
    if (this.useFallback) {
      const fallbackStats = fallbackVectorSearchService.getStats();
      return {
        ...fallbackStats,
        useFallback: true
      };
    }
    
    return {
      documentCount: this.documents.length,
      isInitialized: this.isInitialized,
      useFallback: false
    };
  }
}

// 导出单例实例
export const vectorSearchService = new VectorSearchService();