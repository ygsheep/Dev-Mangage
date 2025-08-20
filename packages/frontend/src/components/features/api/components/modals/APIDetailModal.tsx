import React, { useState } from 'react'
import { X, Code2, FileText, Send, Play } from 'lucide-react'
import { API } from '@shared/types'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import toast from 'react-hot-toast'
import CodeHighlight from '../../../../common/CodeHighlight'

interface APIDetailModalProps {
  api: API
  isOpen: boolean
  onClose: () => void
  projectBaseUrl?: string
  onTestAPI?: (api: API) => void
}

const APIDetailModal: React.FC<APIDetailModalProps> = ({ 
  api, 
  isOpen, 
  onClose, 
  projectBaseUrl,
  onTestAPI 
}) => {
  const [activeTab, setActiveTab] = useState<'frontend' | 'backend' | 'request' | 'response'>('frontend')

  if (!isOpen) return null

  const handleCopy = (_text: string, type: string) => {
    toast.success(`${type}已复制到剪贴板`)
  }

  // Sample request/response data
  const sampleRequest = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-token-here'
    },
    body: api.method !== 'GET' ? {
      name: 'string',
      email: 'user@example.com',
      password: 'string'
    } : null
  }

  const sampleResponse = {
    success: {
      status: 200,
      data: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2024-01-01T00:00:00Z'
      }
    },
    error: {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: '请求参数验证失败',
        details: [
          {
            field: 'email',
            message: '邮箱格式不正确'
          }
        ]
      }
    }
  }

  const frontendCode = api.frontendCode || `// React + Axios 示例
import axios from 'axios'

const api${api.name.replace(/\s+/g, '')} = async (${api.method !== 'GET' ? 'data: any' : ''}) => {
  try {
    const response = await axios.${api.method.toLowerCase()}('${api.path}'${api.method !== 'GET' ? ', data' : ''})
    return response.data
  } catch (error) {
    console.error('API调用失败:', error)
    throw error
  }
}

// 使用示例
${api.name.replace(/\s+/g, '')}(${api.method !== 'GET' ? '{ name: "用户名", email: "test@example.com" }' : ''})
  .then(result => {
    console.log('成功:', result)
  })
  .catch(error => {
    console.error('错误:', error)
  })`

  const backendCode = api.backendCode || `// Node.js + Express 示例
app.${api.method.toLowerCase()}('${api.path}', async (req, res) => {
  try {
    ${api.method !== 'GET' ? `const { ${Object.keys(sampleRequest.body || {}).join(', ')} } = req.body` : ''}
    
    // 业务逻辑处理
    const result = await your${api.name.replace(/\s+/g, '')}Service(${api.method !== 'GET' ? Object.keys(sampleRequest.body || {}).join(', ') : ''})
    
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">{api.name}</h2>
            <code className="text-sm text-text-secondary bg-bg-tertiary px-2 py-1 rounded font-mono">
              {api.method} {api.path}
            </code>
            {projectBaseUrl && (
              <div className="text-xs text-text-tertiary mt-1">
                完整URL: {projectBaseUrl.replace(/\/$/, '')}{api.path}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {onTestAPI && (
              <button
                onClick={() => onTestAPI(api)}
                className="px-4 py-2 text-sm font-medium text-white bg-status-success rounded-lg hover:opacity-80 transition-colors flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>测试接口</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-primary px-6">
          <button
            onClick={() => setActiveTab('frontend')}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'frontend'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Code2 className="w-4 h-4 mr-2" />
            前端代码
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'backend'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Code2 className="w-4 h-4 mr-2" />
            后端代码
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'request'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Send className="w-4 h-4 mr-2" />
            请求参数
          </button>
          <button
            onClick={() => setActiveTab('response')}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'response'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            返回参数
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'frontend' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-text-primary">前端调用代码</h3>
                <CopyToClipboard
                  text={frontendCode}
                  onCopy={() => handleCopy(frontendCode, '前端代码')}
                >
                  <button className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-blue-600 rounded text-sm hover:bg-blue-100 transition-colors">
                    复制代码
                  </button>
                </CopyToClipboard>
              </div>
              <CodeHighlight
                code={frontendCode}
                language="javascript"
                showLineNumbers={false}
                showCopyButton={true}
                maxHeight="400px"
              />
            </div>
          )}

          {activeTab === 'backend' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-text-primary">后端实现代码</h3>
                <CopyToClipboard
                  text={backendCode}
                  onCopy={() => handleCopy(backendCode, '后端代码')}
                >
                  <button className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-blue-600 rounded text-sm hover:bg-blue-100 transition-colors">
                    复制代码
                  </button>
                </CopyToClipboard>
              </div>
              <CodeHighlight
                code={backendCode}
                language="javascript"
                showLineNumbers={false}
                showCopyButton={true}
                maxHeight="400px"
              />
            </div>
          )}

          {activeTab === 'request' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">请求参数</h3>
                
                {/* Headers */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-text-secondary mb-2">请求头 (Headers)</h4>
                  <CodeHighlight
                    code={JSON.stringify(sampleRequest.headers, null, 2)}
                    language="json"
                    showLineNumbers={false}
                    showCopyButton={true}
                    maxHeight="200px"
                  />
                </div>

                {/* Body */}
                {api.method !== 'GET' && sampleRequest.body && (
                  <div>
                    <h4 className="text-md font-medium text-text-secondary mb-2">请求体 (Body)</h4>
                    <CodeHighlight
                      code={JSON.stringify(sampleRequest.body, null, 2)}
                      language="json"
                      showLineNumbers={false}
                      showCopyButton={true}
                      maxHeight="200px"
                    />
                  </div>
                )}

                {/* Description */}
                {api.description && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-text-secondary mb-2">接口说明</h4>
                    <p className="text-text-secondary bg-bg-tertiary p-4 rounded-lg">{api.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'response' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-text-primary">返回参数</h3>
              
              {/* Success Response */}
              <div>
                <div className="flex items-center mb-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded mr-2">200</span>
                  <h4 className="text-md font-medium text-text-secondary">成功响应</h4>
                </div>
                <CodeHighlight
                  code={JSON.stringify(sampleResponse.success, null, 2)}
                  language="json"
                  showLineNumbers={false}
                  showCopyButton={true}
                  maxHeight="300px"
                />
              </div>

              {/* Error Response */}
              <div>
                <div className="flex items-center mb-2">
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded mr-2">400</span>
                  <h4 className="text-md font-medium text-text-secondary">错误响应</h4>
                </div>
                <CodeHighlight
                  code={JSON.stringify(sampleResponse.error, null, 2)}
                  language="json"
                  showLineNumbers={false}
                  showCopyButton={true}
                  maxHeight="300px"
                />
              </div>

              {/* Response Fields Description */}
              <div>
                <h4 className="text-md font-medium text-text-secondary mb-3">字段说明</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-border-primary">
                    <span className="font-mono text-sm text-text-primary">id</span>
                    <span className="text-sm text-text-secondary">用户唯一标识符</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">number</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border-primary">
                    <span className="font-mono text-sm text-text-primary">name</span>
                    <span className="text-sm text-text-secondary">用户姓名</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">string</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border-primary">
                    <span className="font-mono text-sm text-text-primary">email</span>
                    <span className="text-sm text-text-secondary">用户邮箱</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">string</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="font-mono text-sm text-text-primary">createdAt</span>
                    <span className="text-sm text-text-secondary">创建时间</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">datetime</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border-primary bg-bg-tertiary">
          <div className="text-sm text-text-tertiary">
            最后更新: {new Date(api.updatedAt).toLocaleString('zh-CN')}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default APIDetailModal