// Ollama模型管理服务
export interface OllamaModel {
  name: string
  model: string
  size: number
  digest: string
  details: {
    format: string
    family: string
    families: string[]
    parameter_size: string
    quantization_level: string
  }
  expires_at: string
  size_vram: number
}

export interface OllamaModelsResponse {
  models: OllamaModel[]
}

export const RECOMMENDED_MODELS = [
  {
    name: 'qwen2.5-coder:7b',
    description: 'Qwen2.5 Coder 7B - 推荐，代码理解能力强',
    size: '4.7GB',
    category: 'code'
  },
  {
    name: 'qwen2.5-coder:1.5b',
    description: 'Qwen2.5 Coder 1.5B - 轻量版，速度快',
    size: '1.0GB',
    category: 'code'
  },
  {
    name: 'qwen2.5:7b',
    description: 'Qwen2.5 7B - 通用模型，中文支持好',
    size: '4.7GB',
    category: 'general'
  },
  {
    name: 'qwen2.5:1.5b',
    description: 'Qwen2.5 1.5B - 轻量通用模型',
    size: '1.0GB',
    category: 'general'
  },
  {
    name: 'deepseek-coder:6.7b',
    description: 'DeepSeek Coder 6.7B - 专业代码模型',
    size: '3.8GB',
    category: 'code'
  },
  {
    name: 'codegemma:7b',
    description: 'CodeGemma 7B - Google代码模型',
    size: '5.0GB',
    category: 'code'
  }
]

export const DEEPSEEK_MODELS = [
  {
    name: 'deepseek-coder',
    description: 'DeepSeek Coder - 专业代码理解模型'
  },
  {
    name: 'deepseek-chat',
    description: 'DeepSeek Chat - 通用对话模型'
  }
]

export const OPENAI_MODELS = [
  {
    name: 'gpt-4',
    description: 'GPT-4 - 最强理解能力，价格较高'
  },
  {
    name: 'gpt-4-turbo',
    description: 'GPT-4 Turbo - 更快的GPT-4版本'
  },
  {
    name: 'gpt-3.5-turbo',
    description: 'GPT-3.5 Turbo - 性价比高的选择'
  }
]

class OllamaService {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl
  }

  // 获取已安装的模型列表
  async getInstalledModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: OllamaModelsResponse = await response.json()
      return data.models || []
    } catch (error) {
      console.error('获取Ollama模型列表失败:', error)
      throw error
    }
  }

  // 检查Ollama服务是否可用
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  // 拉取模型 (需要流式处理，这里提供接口)
  async pullModel(modelName: string, onProgress?: (progress: any) => void): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: modelName,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body')
    }

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const progress = JSON.parse(line)
            onProgress?.(progress)
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  // 获取模型信息
  async getModelInfo(modelName: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: modelName
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('获取模型信息失败:', error)
      throw error
    }
  }

  // 格式化模型大小
  static formatModelSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  // 检查模型是否为代码相关模型
  static isCodeModel(modelName: string): boolean {
    const codeKeywords = ['coder', 'code', 'programming', 'dev']
    return codeKeywords.some(keyword => modelName.toLowerCase().includes(keyword))
  }

  // 获取推荐的模型配置
  static getRecommendedModelConfig(modelName: string) {
    return RECOMMENDED_MODELS.find(model => model.name === modelName)
  }
}

export default OllamaService