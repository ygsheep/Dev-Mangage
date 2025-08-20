/**
 * MCP服务器配置管理
 * 统一管理所有配置项，支持环境变量覆盖
 */
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config();

/**
 * 数据库配置接口
 */
export interface DatabaseConfig {
  /** 数据库连接URL */
  url: string;
  /** 连接池最大连接数 */
  maxConnections?: number;
  /** 查询超时时间（毫秒） */
  queryTimeout?: number;
}

/**
 * 搜索配置接口
 */
export interface SearchConfig {
  /** 索引缓存TTL（毫秒） */
  indexCacheTtl: number;
  /** 默认搜索结果限制 */
  defaultLimit: number;
  /** 最大搜索结果限制 */
  maxLimit: number;
  /** Fuse.js搜索阈值 */
  fuseThreshold: number;
  /** 向量搜索相似度阈值 */
  vectorThreshold: number;
  /** 是否启用向量搜索 */
  enableVectorSearch: boolean;
  /** 向量模型路径或名称 */
  vectorModel: string;
  /** 向量维度 */
  vectorDimension: number;
}

/**
 * HTTP服务器配置接口
 */
export interface HttpServerConfig {
  /** 服务器端口 */
  port: number;
  /** 主机地址 */
  host: string;
  /** CORS域名白名单 */
  corsOrigins: string[];
  /** 是否启用请求日志 */
  enableRequestLogging: boolean;
  /** 请求体大小限制 */
  bodySizeLimit: string;
}

/**
 * 日志配置接口
 */
export interface LogConfig {
  /** 日志级别 */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** 是否输出到文件 */
  enableFileOutput: boolean;
  /** 日志文件路径 */
  filePath?: string;
  /** 是否启用彩色输出 */
  enableColors: boolean;
}

/**
 * RAG配置接口
 */
export interface RagConfig {
  /** 是否启用RAG功能 */
  enabled: boolean;
  /** 上下文窗口大小 */
  contextWindow: number;
  /** 最大上下文tokens */
  maxContextTokens: number;
  /** 相关性分数阈值 */
  relevanceThreshold: number;
}

/**
 * 完整配置接口
 */
export interface McpServerConfig {
  /** 服务器基本信息 */
  server: {
    name: string;
    version: string;
    description: string;
  };
  /** 数据库配置 */
  database: DatabaseConfig;
  /** 搜索配置 */
  search: SearchConfig;
  /** HTTP服务器配置 */
  http: HttpServerConfig;
  /** 日志配置 */
  log: LogConfig;
  /** RAG配置 */
  rag: RagConfig;
}

/**
 * 解析环境变量为数字
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 解析环境变量为布尔值
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * 解析CORS原点
 */
function parseCorsOrigins(value: string | undefined): string[] {
  if (!value) return ['http://localhost:3000', 'http://localhost:5173'];
  return value.split(',').map(origin => origin.trim()).filter(Boolean);
}

/**
 * 构建默认配置
 */
export function createDefaultConfig(): McpServerConfig {
  return {
    server: {
      name: 'devapi-mcp-server',
      version: '2.0.0',
      description: 'DevAPI Manager MCP智能搜索服务器'
    },
    database: {
      url: process.env.DATABASE_URL || 'file:../backend/prisma/dev.db',
      maxConnections: parseNumber(process.env.DB_MAX_CONNECTIONS, 10),
      queryTimeout: parseNumber(process.env.DB_QUERY_TIMEOUT, 30000)
    },
    search: {
      indexCacheTtl: parseNumber(process.env.SEARCH_INDEX_CACHE_TTL, 5 * 60 * 1000),
      defaultLimit: parseNumber(process.env.SEARCH_DEFAULT_LIMIT, 10),
      maxLimit: parseNumber(process.env.SEARCH_MAX_LIMIT, 100),
      fuseThreshold: parseFloat(process.env.SEARCH_FUSE_THRESHOLD || '0.3'),
      vectorThreshold: parseFloat(process.env.SEARCH_VECTOR_THRESHOLD || '0.5'),
      enableVectorSearch: parseBoolean(process.env.SEARCH_ENABLE_VECTOR, true),
      vectorModel: process.env.SEARCH_VECTOR_MODEL || 'Xenova/all-MiniLM-L6-v2',
      vectorDimension: parseNumber(process.env.SEARCH_VECTOR_DIMENSION, 384)
    },
    http: {
      port: parseNumber(process.env.MCP_HTTP_PORT || process.env.HTTP_MCP_PORT, 3000),
      host: process.env.MCP_HTTP_HOST || '0.0.0.0',
      corsOrigins: parseCorsOrigins(process.env.MCP_HTTP_CORS_ORIGINS),
      enableRequestLogging: parseBoolean(process.env.MCP_HTTP_ENABLE_REQUEST_LOGGING, true),
      bodySizeLimit: process.env.MCP_HTTP_BODY_SIZE_LIMIT || '10mb'
    },
    log: {
      level: (process.env.LOG_LEVEL as any) || 'info',
      enableFileOutput: parseBoolean(process.env.LOG_ENABLE_FILE_OUTPUT, false),
      filePath: process.env.LOG_FILE_PATH || path.join(process.cwd(), 'logs', 'mcp-server.log'),
      enableColors: parseBoolean(process.env.LOG_ENABLE_COLORS, true)
    },
    rag: {
      enabled: parseBoolean(process.env.RAG_ENABLED, true),
      contextWindow: parseNumber(process.env.RAG_CONTEXT_WINDOW, 4096),
      maxContextTokens: parseNumber(process.env.RAG_MAX_CONTEXT_TOKENS, 2048),
      relevanceThreshold: parseFloat(process.env.RAG_RELEVANCE_THRESHOLD || '0.6')
    }
  };
}

/**
 * 验证配置有效性
 */
export function validateConfig(config: McpServerConfig): void {
  const errors: string[] = [];

  // 验证端口范围
  if (config.http.port < 1 || config.http.port > 65535) {
    errors.push(`无效的HTTP端口: ${config.http.port}`);
  }

  // 验证搜索阈值
  if (config.search.fuseThreshold < 0 || config.search.fuseThreshold > 1) {
    errors.push(`无效的Fuse搜索阈值: ${config.search.fuseThreshold}`);
  }

  if (config.search.vectorThreshold < 0 || config.search.vectorThreshold > 1) {
    errors.push(`无效的向量搜索阈值: ${config.search.vectorThreshold}`);
  }

  // 验证限制值
  if (config.search.defaultLimit < 1) {
    errors.push(`默认搜索限制必须大于0: ${config.search.defaultLimit}`);
  }

  if (config.search.maxLimit < config.search.defaultLimit) {
    errors.push(`最大搜索限制不能小于默认限制: ${config.search.maxLimit} < ${config.search.defaultLimit}`);
  }

  if (errors.length > 0) {
    throw new Error(`配置验证失败:\n${errors.join('\n')}`);
  }
}

/**
 * 获取配置实例
 */
export function getConfig(): McpServerConfig {
  const config = createDefaultConfig();
  validateConfig(config);
  return config;
}

/**
 * 导出配置实例
 */
export const config = getConfig();

/**
 * 打印配置信息（隐藏敏感信息）
 */
export function printConfigInfo(): void {
  const safeConfig = JSON.parse(JSON.stringify(config));
  
  // 隐藏敏感的数据库URL信息
  if (safeConfig.database.url.includes('://')) {
    const url = new URL(safeConfig.database.url);
    url.password = '***';
    safeConfig.database.url = url.toString();
  }

  console.log('🔧 MCP服务器配置:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📦 服务器: ${config.server.name} v${config.server.version}`);
  console.log(`🌐 HTTP端口: ${config.http.host}:${config.http.port}`);
  console.log(`🔍 搜索配置: 默认限制=${config.search.defaultLimit}, 向量搜索=${config.search.enableVectorSearch ? '启用' : '禁用'}`);
  console.log(`📊 RAG功能: ${config.rag.enabled ? '启用' : '禁用'}`);
  console.log(`📝 日志级别: ${config.log.level}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}