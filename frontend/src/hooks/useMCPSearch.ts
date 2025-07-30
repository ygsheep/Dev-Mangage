import { useState, useCallback } from 'react'

// MCP客户端模拟接口
class MCPClient {
  private serverUrl: string

  constructor(serverUrl = 'http://localhost:3002') {
    this.serverUrl = serverUrl
  }

  async callTool(name: string, arguments: any) {
    try {
      const response = await fetch(`${this.serverUrl}/mcp/tools/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ arguments }),
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

  return {
    searchProjects,
    searchAPIs,
    searchTags,
    searchGlobal,
    getSearchSuggestions,
    getRecentItems,
    refreshSearchIndex,
    isLoading,
    error,
  }
}