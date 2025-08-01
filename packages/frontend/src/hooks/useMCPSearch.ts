import { useState, useCallback } from 'react'
import { mcpConfig } from '../config/mcpConfig'

/**
 * MCP 客户端接口
 * 用于调用 MCP 工具
 */
class MCPClient {
  /**
   * 调用 MCP 工具
   * @param name 工具名称
   * @param args 工具参数
   */
  async callTool(name: string, args: any) {
    try {
      const response = await fetch(mcpConfig.getMCPToolUrl(name), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ arguments: args }),
      })

      if (!response.ok) {
        throw new Error(`MCP tool call failed: ${response.statusText}`)
      }

      const result = await response.json()
      return JSON.parse(result.content[0].text)
    } catch (error) {
      console.error('MCP call error:', error)
      throw error
    }
  }
}

const mcpClient = new MCPClient()

export const useMCPSearch = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callMCPTool = useCallback(async (toolName: string, args: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await mcpClient.callTool(toolName, args)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 搜索项目
  const searchProjects = useCallback(async (query: string, limit = 10) => {
    return callMCPTool('search_projects', { query, limit })
  }, [callMCPTool])

  // 搜索API
  const searchAPIs = useCallback(async (
    query: string, 
    options: {
      projectId?: string
      method?: string
      status?: string
      limit?: number
    } = {}
  ) => {
    return callMCPTool('search_apis', { query, ...options })
  }, [callMCPTool])

  // 搜索标签
  const searchTags = useCallback(async (
    query: string,
    options: {
      projectId?: string
      limit?: number
    } = {}
  ) => {
    return callMCPTool('search_tags', { query, ...options })
  }, [callMCPTool])

  // 全局搜索
  const searchGlobal = useCallback(async (
    query: string,
    types: string[] = ['projects', 'apis', 'tags'],
    limit = 5
  ) => {
    return callMCPTool('global_search', { query, types, limit })
  }, [callMCPTool])

  // 获取搜索建议
  const getSearchSuggestions = useCallback(async (query: string, limit = 5) => {
    return callMCPTool('get_search_suggestions', { query, limit })
  }, [callMCPTool])

  // 获取最近项目
  const getRecentItems = useCallback(async (limit = 10) => {
    return callMCPTool('get_recent_items', { limit })
  }, [callMCPTool])

  // 刷新搜索索引
  const refreshSearchIndex = useCallback(async (force = false) => {
    return callMCPTool('refresh_search_index', { force })
  }, [callMCPTool])

  // 向量语义搜索
  const vectorSearch = useCallback(async (
    query: string, 
    options: {
      limit?: number
      threshold?: number
    } = {}
  ) => {
    return callMCPTool('vector_search', { query, ...options })
  }, [callMCPTool])

  // 混合搜索（关键词+语义搜索）
  const hybridSearch = useCallback(async (
    query: string,
    options: {
      types?: string[]
      limit?: number
      vectorWeight?: number
      fuzzyWeight?: number
    } = {}
  ) => {
    return callMCPTool('hybrid_search', { query, ...options })
  }, [callMCPTool])

  // 构建向量搜索索引
  const buildVectorIndex = useCallback(async () => {
    return callMCPTool('build_vector_index', {})
  }, [callMCPTool])

  // RAG增强的智能API搜索
  const ragSearchAPIs = useCallback(async (
    query: string,
    options: {
      method?: string
      projectId?: string
      tags?: string[]
      includeRelated?: boolean
    } = {}
  ) => {
    return callMCPTool('rag_search_apis', { query, ...options })
  }, [callMCPTool])

  // 获取API推荐
  const getAPIRecommendations = useCallback(async (apiId: string, limit = 5) => {
    return callMCPTool('get_api_recommendations', { apiId, limit })
  }, [callMCPTool])

  // 构建API上下文索引
  const buildAPIContext = useCallback(async () => {
    return callMCPTool('build_api_context', {})
  }, [callMCPTool])

  return {
    searchProjects,
    searchAPIs,
    searchTags,
    searchGlobal,
    getSearchSuggestions,
    getRecentItems,
    refreshSearchIndex,
    vectorSearch,
    hybridSearch,
    buildVectorIndex,
    ragSearchAPIs,
    getAPIRecommendations,
    buildAPIContext,
    isLoading,
    error,
  }
}