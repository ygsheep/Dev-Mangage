import React, { useState, useRef, useEffect } from 'react'
import { Send, Terminal, Bot, User, Copy, Download, Settings, RefreshCw, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import MarkdownPreview from '@uiw/react-markdown-preview'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export const ChatsPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'system',
      content: '欢迎使用 DevAPI Manager AI 助手！我可以帮助您进行项目开发、API设计、代码生成等任务。',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  // 清空对话
  const clearMessages = () => {
    setMessages([{
      id: 'welcome',
      type: 'system',
      content: '欢迎使用 DevAPI Manager AI 助手！我可以帮助您进行项目开发、API设计、代码生成等任务。',
      timestamp: new Date()
    }])
    toast.success('对话已清空')
  }

  // 发送消息到Gemini CLI
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    // 添加用户消息
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamingMessage('')

    try {
      // 调用后端API与Gemini CLI交互
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: 'main-session',
          provider: 'gemini'
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      let assistantMessage = ''
      
      // 流式读取响应
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                assistantMessage += data.content
                setStreamingMessage(assistantMessage)
              }
            } catch (e) {
              // 忽略JSON解析错误
            }
          }
        }
      }

      // 添加完整的助手回复
      const assistantReply: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: assistantMessage,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantReply])
      setStreamingMessage('')

    } catch (error) {
      console.error('发送消息失败:', error)
      toast.error('发送消息失败，请重试')
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `错误：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setStreamingMessage('')
    }
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 复制消息内容
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('已复制到剪贴板')
  }

  // 导出对话
  const exportChat = () => {
    const chatContent = messages
      .map(msg => `[${msg.type}] ${msg.content}`)
      .join('\n\n')
    
    const blob = new Blob([chatContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('对话已导出')
  }

  return (
    <div className="h-full flex flex-col bg-[#212121] text-gray-100">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-medium text-gray-300">Untitled Chat</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
            Share
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {messages.length === 1 ? (
            /* 欢迎界面 */
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                <Bot className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-medium text-gray-300 mb-2">How can I help you today?</h2>
                <p className="text-gray-500">I'm Claude, an AI assistant created by Anthropic.</p>
              </div>
            </div>
          ) : (
            /* 对话消息 */
            <div className="space-y-6">
              {messages.slice(1).map(message => (
                <div key={message.id} className="space-y-4">
                  {message.type === 'user' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-100 leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  )}
                  {message.type === 'assistant' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-gray-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="prose prose-invert max-w-none">
                          <MarkdownPreview
                            source={message.content}
                            data-color-mode="dark"
                            style={{
                              backgroundColor: 'transparent',
                              color: '#e5e7eb',
                              fontSize: '14px',
                              lineHeight: '1.6'
                            }}
                          />
                        </div>
                        <button
                          onClick={() => copyMessage(message.content)}
                          className="mt-2 p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded transition-all"
                          title="复制"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* 流式消息显示 */}
              {streamingMessage && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="prose prose-invert max-w-none">
                      <MarkdownPreview
                        source={streamingMessage}
                        data-color-mode="dark"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#e5e7eb',
                          fontSize: '14px',
                          lineHeight: '1.6'
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-2 flex items-center">
                      <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                      正在生成...
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 固定输入框 */}
        <div className="sticky bottom-4 px-6 pb-4">
          <div className="relative max-w-4xl mx-auto space-y-3">
            {/* 功能按钮组 */}
            <div className="flex items-center justify-center space-x-2">
              <button 
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#404040] rounded-lg transition-colors"
                title="添加附件"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button 
                onClick={clearMessages}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#404040] rounded-lg transition-colors"
                title="清空对话"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-1 text-sm text-gray-400 px-2">
                <span>Claude Sonnet 4</span>
                <button className="p-1 hover:text-gray-200 transition-colors">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-[#d2691e] hover:bg-[#e07428] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 12l20-9-8 20-1-11-11-0z"/>
                </svg>
              </button>
            </div>

            {/* 输入框 */}
            <div className="relative rounded-2xl border border-[#404040] focus-within:border-[#505050] transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reply to Claude..."
                className="w-full bg-transparent text-gray-100 placeholder-gray-500 resize-none focus:outline-none text-base leading-6 min-h-[60px] max-h-[200px] p-4 rounded-2xl"
                rows={1}
                disabled={isLoading}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(Math.max(target.scrollHeight, 60), 200) + 'px'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatsPage