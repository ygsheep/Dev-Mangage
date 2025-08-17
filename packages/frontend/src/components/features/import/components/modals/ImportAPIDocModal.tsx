import React, { useState } from 'react'
import { X, Upload, FileText, AlertCircle, CheckCircle, Code, Download, Brain, Settings } from 'lucide-react'
import { API, HTTPMethod, APIStatus, APIParameter, APIResponseSchema } from '@shared/types'
import { createAIParsingService, AIParsingConfig, AI_PARSING_PRESETS } from '../../../../../services/aiParsingService'
import AIConfigModal from '../../../../integrations/ai/AIConfigModal'
import toast from 'react-hot-toast'

interface ImportAPIDocModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (parsedAPIs: API[]) => void
  projectId: string
}

interface ParsedAPI {
  name: string
  method: HTTPMethod
  path: string
  description?: string
  parameters?: APIParameter[]
  responses?: APIResponseSchema[]
}

const ImportAPIDocModal: React.FC<ImportAPIDocModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [parsedAPIs, setParsedAPIs] = useState<ParsedAPI[]>([])
  const [parseError, setParseError] = useState<string>('')
  const [previewContent, setPreviewContent] = useState<string>('')
  const [useAI, setUseAI] = useState(true)
  const [aiConfig, setAiConfig] = useState<AIParsingConfig>(() => {
    // 从localStorage读取配置
    const saved = localStorage.getItem('ai-parsing-config')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse AI config from localStorage:', e)
      }
    }
    return AI_PARSING_PRESETS.ollama_qwen
  })
  const [showAIConfig, setShowAIConfig] = useState(false)
  const [parseConfidence, setParseConfidence] = useState<number>(0)

  if (!isOpen) return null

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === 'text/markdown' || selectedFile.name.endsWith('.md')) {
        setFile(selectedFile)
        setParseError('')
        
        // 读取文件内容预览
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          setPreviewContent(content.slice(0, 1000) + (content.length > 1000 ? '...' : ''))
        }
        reader.readAsText(selectedFile)
      } else {
        toast.error('请选择Markdown文件 (.md)')
        setFile(null)
      }
    }
  }

  const parseMarkdownAPI = (content: string): ParsedAPI[] => {
    const apis: ParsedAPI[] = []
    
    try {
      // 按行分割内容
      const lines = content.split('\n')
      let currentAPI: Partial<ParsedAPI> | null = null
      let currentSection = ''
      let isInCodeBlock = false
      let codeBlockContent = ''
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // 检测代码块
        if (line.startsWith('```')) {
          isInCodeBlock = !isInCodeBlock
          if (!isInCodeBlock && codeBlockContent && currentAPI) {
            // 处理代码块内容
            if (currentSection === 'request' && codeBlockContent.includes('{')) {
              // 尝试解析请求参数
              try {
                const jsonMatch = codeBlockContent.match(/\{[\s\S]*\}/)
                if (jsonMatch) {
                  const jsonObj = JSON.parse(jsonMatch[0])
                  currentAPI.parameters = Object.keys(jsonObj).map(key => ({
                    name: key,
                    type: typeof jsonObj[key] as any,
                    required: true,
                    description: `${key}参数`,
                    location: 'body' as const
                  }))
                }
              } catch (e) {
                // 忽略JSON解析错误
              }
            }
          }
          codeBlockContent = ''
          continue
        }
        
        if (isInCodeBlock) {
          codeBlockContent += line + '\n'
          continue
        }
        
        // 检测API接口定义
        const apiMatch = line.match(/^#{1,4}\s*(.+?)\s*-\s*(GET|POST|PUT|DELETE|PATCH)\s+(.+)$/)
        if (apiMatch) {
          // 保存上一个API
          if (currentAPI && currentAPI.name && currentAPI.method && currentAPI.path) {
            apis.push(currentAPI as ParsedAPI)
          }
          
          // 开始新的API
          currentAPI = {
            name: apiMatch[1].trim(),
            method: apiMatch[2] as HTTPMethod,
            path: apiMatch[3].trim(),
            description: '',
            parameters: [],
            responses: []
          }
          currentSection = 'basic'
          continue
        }
        
        // 检测HTTP方法和路径的另一种格式
        const methodPathMatch = line.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(.+)$/)
        if (methodPathMatch && currentAPI) {
          currentAPI.method = methodPathMatch[1] as HTTPMethod
          currentAPI.path = methodPathMatch[2].trim()
          continue
        }
        
        // 检测描述
        if (line && !line.startsWith('#') && !line.startsWith('|') && currentAPI && !currentAPI.description) {
          currentAPI.description = line
          continue
        }
        
        // 检测请求参数表格
        if (line.includes('参数名') && line.includes('类型') && line.includes('必填')) {
          currentSection = 'parameters'
          continue
        }
        
        // 检测响应示例
        if (line.includes('响应') || line.includes('返回')) {
          currentSection = 'response'
          continue
        }
        
        // 解析参数表格行
        if (currentSection === 'parameters' && line.includes('|') && !line.includes('---')) {
          const parts = line.split('|').map(p => p.trim()).filter(p => p)
          if (parts.length >= 3 && currentAPI) {
            const [name, type, required, ...descParts] = parts
            if (name && type && name !== '参数名') {
              if (!currentAPI.parameters) currentAPI.parameters = []
              currentAPI.parameters.push({
                name,
                type: type.toLowerCase() as any,
                required: required.includes('是') || required.includes('Y'),
                description: descParts.join(' ') || `${name}参数`,
                location: 'body'
              })
            }
          }
        }
      }
      
      // 保存最后一个API
      if (currentAPI && currentAPI.name && currentAPI.method && currentAPI.path) {
        apis.push(currentAPI as ParsedAPI)
      }
      
    } catch (error) {
      console.error('解析API文档失败:', error)
      throw new Error('API文档格式无法识别，请检查文档格式')
    }
    
    return apis
  }

  const handleParse = async () => {
    if (!file) return
    
    setIsUploading(true)
    setParseError('')
    setParsedAPIs([])
    setParseConfidence(0)
    
    try {
      const content = await file.text()
      
      if (useAI) {
        // 使用AI解析
        const aiService = createAIParsingService(aiConfig)
        const result = await aiService.parseAPIDocument(content, projectId)
        
        if (result.success && result.apis.length > 0) {
          // 转换AI解析结果为组件需要的格式
          const convertedAPIs: ParsedAPI[] = result.apis.map(api => ({
            name: api.name,
            method: api.method,
            path: api.path,
            description: api.description,
            parameters: [], // AI解析的参数信息会在这里
            responses: []   // AI解析的响应信息会在这里
          }))
          
          setParsedAPIs(convertedAPIs)
          setParseConfidence(result.confidence)
          toast.success(`AI成功解析到 ${result.apis.length} 个API接口 (置信度: ${Math.round(result.confidence * 100)}%)`)
        } else {
          throw new Error(result.errors.join(', ') || 'AI解析失败')
        }
      } else {
        // 使用传统规则解析
        const parsed = parseMarkdownAPI(content)
        
        if (parsed.length === 0) {
          throw new Error('未能从文档中解析到任何API接口，请检查文档格式')
        }
        
        setParsedAPIs(parsed)
        setParseConfidence(0.7) // 传统解析给个固定置信度
        toast.success(`成功解析到 ${parsed.length} 个API接口`)
      }
    } catch (error: any) {
      setParseError(error.message || '解析失败')
      toast.error('API文档解析失败: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleImport = () => {
    if (parsedAPIs.length === 0) return
    
    // 转换为完整的API对象
    const fullAPIs: API[] = parsedAPIs.map((parsedAPI, index) => ({
      id: `imported-${Date.now()}-${index}`,
      projectId,
      name: parsedAPI.name,
      description: parsedAPI.description || '',
      method: parsedAPI.method,
      path: parsedAPI.path,
      status: APIStatus.NOT_STARTED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
    
    onSuccess(fullAPIs)
    onClose()
  }

  const handleClose = () => {
    setFile(null)
    setParsedAPIs([])
    setParseError('')
    setPreviewContent('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-text-primary">导入API接口文档</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {!file ? (
            <div className="space-y-6">
              {/* 文件上传区域 */}
              <div className="border-2 border-dashed border-border-primary rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <div className="flex flex-col items-center space-y-4">
                  <Upload className="w-12 h-12 text-text-tertiary" />
                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      选择API接口设计文档
                    </h3>
                    <p className="text-text-secondary mb-4">
                      支持Markdown格式的API文档，自动解析接口信息
                    </p>
                    <label className="btn-primary cursor-pointer">
                      <input
                        type="file"
                        accept=".md,.markdown"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      选择文件
                    </label>
                  </div>
                </div>
              </div>

              {/* 支持格式说明 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">支持的文档格式示例:</h4>
                <pre className="text-xs text-blue-700 bg-blue-100 p-3 rounded overflow-x-auto">
{`## 用户登录 - POST /api/v1/auth/login
用户登录接口，支持用户名/邮箱登录

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| username | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 |

### 响应示例
\`\`\`json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "admin"
    }
  }
}
\`\`\``}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 文件信息 */}
              <div className="bg-bg-tertiary rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-text-primary">{file.name}</div>
                      <div className="text-sm text-text-secondary">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    重新选择
                  </button>
                </div>
              </div>

              {/* 解析配置选项 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center space-x-2">
                  <Brain className="w-4 h-4" />
                  <span>解析设置</span>
                </h4>
                
                <div className="space-y-3">
                  {/* AI解析开关 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="use-ai"
                        checked={useAI}
                        onChange={(e) => setUseAI(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-bg-tertiary border-border-primary rounded focus:ring-blue-500"
                      />
                      <label htmlFor="use-ai" className="text-sm font-medium text-blue-800">
                        使用AI智能解析
                      </label>
                    </div>
                    
                    {useAI && (
                      <button
                        onClick={() => setShowAIConfig(true)}
                        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Settings className="w-3 h-3" />
                        <span>配置</span>
                      </button>
                    )}
                  </div>

                  {/* AI配置状态显示 */}
                  {useAI && (
                    <div className="text-xs text-blue-700">
                      <div>当前使用: {aiConfig.provider === 'ollama' ? 'Ollama本地' : aiConfig.provider === 'deepseek' ? 'DeepSeek在线' : 'OpenAI在线'}</div>
                      <div>模型: {aiConfig.model}</div>
                    </div>
                  )}

                  <div className="text-xs text-blue-600">
                    {useAI 
                      ? '✨ AI模式可以更准确地识别复杂格式的API文档，支持自然语言描述'
                      : '📝 传统模式使用规则匹配，适合标准格式的Markdown文档'
                    }
                  </div>
                </div>
              </div>

              {/* 文件内容预览 */}
              {previewContent && (
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-2">文档预览:</h4>
                  <pre className="bg-bg-tertiary rounded-lg p-4 text-xs text-text-secondary overflow-x-auto max-h-40">
                    {previewContent}
                  </pre>
                </div>
              )}

              {/* 解析错误 */}
              {parseError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">解析失败</h4>
                      <p className="text-sm text-red-700 mt-1">{parseError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 解析结果 */}
              {parsedAPIs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h4 className="text-sm font-medium text-green-800">
                        成功解析到 {parsedAPIs.length} 个API接口
                      </h4>
                    </div>
                    
                    {parseConfidence > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          parseConfidence >= 0.8 ? 'bg-green-100 text-green-800' :
                          parseConfidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          置信度: {Math.round(parseConfidence * 100)}%
                        </div>
                        {useAI && (
                          <div className="text-xs text-blue-600 flex items-center space-x-1">
                            <Brain className="w-3 h-3" />
                            <span>AI解析</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {parsedAPIs.map((api, index) => (
                      <div key={index} className="bg-bg-paper border border-border-primary rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-mono font-medium ${
                            api.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                            api.method === 'POST' ? 'bg-green-100 text-green-800' :
                            api.method === 'PUT' ? 'bg-orange-100 text-orange-800' :
                            api.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                            'bg-bg-tertiary text-text-primary'
                          }`}>
                            {api.method}
                          </span>
                          <span className="font-medium text-text-primary">{api.name}</span>
                        </div>
                        <div className="text-sm text-text-secondary mb-2">{api.path}</div>
                        {api.description && (
                          <div className="text-sm text-text-tertiary">{api.description}</div>
                        )}
                        {api.parameters && api.parameters.length > 0 && (
                          <div className="text-xs text-text-tertiary mt-2">
                            参数: {api.parameters.length} 个
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border-primary bg-bg-tertiary">
          <div className="text-sm text-text-secondary">
            {file && `已选择文件: ${file.name}`}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-paper border border-border-primary rounded-lg hover:bg-bg-tertiary"
            >
              取消
            </button>
            
            {file && parsedAPIs.length === 0 && (
              <button
                onClick={handleParse}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>解析中...</span>
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4" />
                    <span>解析文档</span>
                  </>
                )}
              </button>
            )}
            
            {parsedAPIs.length > 0 && (
              <button
                onClick={handleImport}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>导入 {parsedAPIs.length} 个接口</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI配置弹窗 */}
      <AIConfigModal
        isOpen={showAIConfig}
        onClose={() => setShowAIConfig(false)}
        onSave={(config) => {
          setAiConfig(config)
          setShowAIConfig(false)
          // 保存到localStorage
          localStorage.setItem('ai-parsing-config', JSON.stringify(config))
        }}
        currentConfig={aiConfig}
      />
    </div>
  )
}

export default ImportAPIDocModal