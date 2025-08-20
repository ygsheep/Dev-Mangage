/**
 * MCP 配置管理测试文件
 * 测试配置管理的各种功能
 */

import { getMCPUrls, mcpConfig } from './mcpConfig'

// 模拟环境变量
const mockEnv = {
  VITE_BACKEND_HOST: 'test-backend',
  VITE_BACKEND_PORT: '4001',
  VITE_MCP_HTTP_HOST: 'test-mcp',
  VITE_MCP_HTTP_PORT: '4320',
  VITE_MCP_WS_HOST: 'test-ws',
  VITE_MCP_WS_PORT: '4002',
}

describe('MCPConfig', () => {
  beforeEach(() => {
    // 重置配置
    mcpConfig.resetToDefault()
  })

  describe('基础 URL 生成', () => {
    test('应该生成正确的后端基础 URL', () => {
      const url = mcpConfig.getBackendBaseUrl()
      expect(url).toBe('http://localhost:3000/api/v1')
    })

    test('应该生成正确的 MCP HTTP URL', () => {
      const url = mcpConfig.getMCPHttpUrl()
      expect(url).toBe('http://localhost:3320')
    })

    test('应该生成正确的 WebSocket URL', () => {
      const url = mcpConfig.getMCPWebSocketUrl()
      expect(url).toBe('ws://localhost:3000')
    })
  })

  describe('MCP 工具 URL 生成', () => {
    test('应该生成正确的工具调用 URL', () => {
      const url = mcpConfig.getMCPToolUrl('search_projects')
      expect(url).toBe('http://localhost:3000/api/v1/mcp/tools/search_projects')
    })

    test('应该生成正确的状态 URL', () => {
      const url = mcpConfig.getMCPStatusUrl()
      expect(url).toBe('http://localhost:3000/api/v1/mcp/status')
    })

    test('应该生成正确的日志 URL', () => {
      const url = mcpConfig.getMCPLogsUrl()
      expect(url).toBe('http://localhost:3000/api/v1/mcp/logs')
    })

    test('应该生成正确的启动 URL', () => {
      const url = mcpConfig.getMCPStartUrl()
      expect(url).toBe('http://localhost:3000/api/v1/mcp/start')
    })

    test('应该生成正确的停止 URL', () => {
      const url = mcpConfig.getMCPStopUrl()
      expect(url).toBe('http://localhost:3000/api/v1/mcp/stop')
    })

    test('应该生成正确的连接测试 URL', () => {
      const url = mcpConfig.getMCPPingUrl()
      expect(url).toBe('http://localhost:3000/api/v1/mcp/ping')
    })
  })

  describe('流式 URL 生成', () => {
    test('应该生成正确的状态流 URL', () => {
      const url = mcpConfig.getMCPStatusStreamUrl()
      expect(url).toBe('http://localhost:3000/api/v1/mcp/status/stream')
    })

    test('应该生成正确的日志流 URL', () => {
      const url = mcpConfig.getMCPLogStreamUrl()
      expect(url).toBe('http://localhost:3000/api/v1/mcp/logs/stream')
    })
  })

  describe('配置更新', () => {
    test('应该能够更新配置', () => {
      mcpConfig.updateConfig({
        BACKEND_HOST: 'updated-host',
        BACKEND_PORT: '5001',
      })

      const url = mcpConfig.getBackendBaseUrl()
      expect(url).toBe('http://updated-host:5001/api/v1')
    })

    test('应该能够部分更新配置', () => {
      mcpConfig.updateConfig({
        BACKEND_HOST: 'new-host',
      })

      const config = mcpConfig.getCurrentConfig()
      expect(config.BACKEND_HOST).toBe('new-host')
      expect(config.BACKEND_PORT).toBe('3000') // 保持默认值
    })

    test('应该能够重置为默认配置', () => {
      mcpConfig.updateConfig({
        BACKEND_HOST: 'test-host',
      })

      mcpConfig.resetToDefault()
      const config = mcpConfig.getCurrentConfig()
      expect(config.BACKEND_HOST).toBe('localhost')
    })
  })

  describe('配置验证', () => {
    test('默认配置应该是有效的', () => {
      const validation = mcpConfig.validateConfig()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('应该检测无效的主机名', () => {
      mcpConfig.updateConfig({
        BACKEND_HOST: '',
      })

      const validation = mcpConfig.validateConfig()
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('后端主机名不能为空')
    })

    test('应该检测无效的端口号', () => {
      mcpConfig.updateConfig({
        BACKEND_PORT: 'invalid-port',
      })

      const validation = mcpConfig.validateConfig()
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('后端端口号必须是 1-65535 之间的数字')
    })

    test('应该检测超出范围的端口号', () => {
      mcpConfig.updateConfig({
        BACKEND_PORT: '70000',
      })

      const validation = mcpConfig.validateConfig()
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('后端端口号必须是 1-65535 之间的数字')
    })

    test('应该检测多个错误', () => {
      mcpConfig.updateConfig({
        BACKEND_HOST: '',
        MCP_HTTP_HOST: '',
        BACKEND_PORT: 'invalid',
      })

      const validation = mcpConfig.validateConfig()
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(1)
    })
  })

  describe('getMCPUrls 辅助函数', () => {
    test('应该返回所有 URL', () => {
      const urls = getMCPUrls()

      expect(urls).toHaveProperty('backend')
      expect(urls).toHaveProperty('httpServer')
      expect(urls).toHaveProperty('websocket')
      expect(urls).toHaveProperty('status')
      expect(urls).toHaveProperty('logs')
      expect(urls).toHaveProperty('start')
      expect(urls).toHaveProperty('stop')
      expect(urls).toHaveProperty('ping')
    })

    test('URL 应该与单独调用的方法结果一致', () => {
      const urls = getMCPUrls()

      expect(urls.backend).toBe(mcpConfig.getBackendBaseUrl())
      expect(urls.httpServer).toBe(mcpConfig.getMCPHttpUrl())
      expect(urls.websocket).toBe(mcpConfig.getMCPWebSocketUrl())
      expect(urls.status).toBe(mcpConfig.getMCPStatusUrl())
      expect(urls.logs).toBe(mcpConfig.getMCPLogsUrl())
      expect(urls.start).toBe(mcpConfig.getMCPStartUrl())
      expect(urls.stop).toBe(mcpConfig.getMCPStopUrl())
      expect(urls.ping).toBe(mcpConfig.getMCPPingUrl())
    })
  })

  describe('边界情况', () => {
    test('应该处理空字符串配置', () => {
      mcpConfig.updateConfig({
        BACKEND_HOST: '   ',
        BACKEND_PORT: '   ',
      })

      const validation = mcpConfig.validateConfig()
      expect(validation.isValid).toBe(false)
    })

    test('应该处理特殊字符的工具名称', () => {
      const url = mcpConfig.getMCPToolUrl('search-projects_v2')
      expect(url).toBe('http://localhost:3000/api/v1/mcp/tools/search-projects_v2')
    })

    test('应该处理 IPv6 地址', () => {
      mcpConfig.updateConfig({
        BACKEND_HOST: '::1',
      })

      const url = mcpConfig.getBackendBaseUrl()
      expect(url).toBe('http://::1:3000/api/v1')
    })
  })
})

// 集成测试
describe('MCP 配置集成测试', () => {
  test('配置更新后所有 URL 都应该反映新配置', () => {
    mcpConfig.updateConfig({
      BACKEND_HOST: 'integration-test',
      BACKEND_PORT: '9001',
      MCP_HTTP_HOST: 'mcp-test',
      MCP_HTTP_PORT: '9320',
    })

    const urls = getMCPUrls()

    expect(urls.backend).toContain('integration-test:9001')
    expect(urls.httpServer).toContain('mcp-test:9320')
    expect(urls.status).toContain('integration-test:9001')
  })

  test('重置配置后所有 URL 都应该恢复默认值', () => {
    // 先更新配置
    mcpConfig.updateConfig({
      BACKEND_HOST: 'test-host',
    })

    // 然后重置
    mcpConfig.resetToDefault()

    const urls = getMCPUrls()
    expect(urls.backend).toContain('localhost:3000')
    expect(urls.httpServer).toContain('localhost:3320')
  })
})
