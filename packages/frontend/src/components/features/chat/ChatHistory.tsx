import React, { useState, useEffect } from 'react'
import { MessageSquare, Plus, Trash2, Clock, Bot } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'

interface ChatSession {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  messageCount: number
}

interface ChatHistoryProps {
  isCollapsed: boolean
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ isCollapsed }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const location = useLocation()
  const isActiveChat = location.pathname === '/chats'

  // 模拟聊天记录数据
  useEffect(() => {
    const mockSessions: ChatSession[] = [
      {
        id: '1',
        title: 'API设计咨询',
        lastMessage: '请帮我设计一个用户管理的RESTful API...',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
        messageCount: 8
      },
      {
        id: '2', 
        title: '数据库优化',
        lastMessage: '如何优化这个查询的性能？',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前
        messageCount: 12
      },
      {
        id: '3',
        title: '代码重构建议',
        lastMessage: '这段代码有什么改进空间吗？',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1天前
        messageCount: 6
      }
    ]
    setSessions(mockSessions)
  }, [])

  // 创建新对话
  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `对话 ${sessions.length + 1}`,
      lastMessage: '新建对话',
      timestamp: new Date(),
      messageCount: 0
    }
    setSessions(prev => [newSession, ...prev])
    toast.success('新对话已创建')
  }

  // 删除对话
  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    toast.success('对话已删除')
  }

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return '刚刚'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (isCollapsed) {
    return (
      <div className="px-3 py-2">
        <div className="text-center">
          <Link
            to="/chats"
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-300 ${
              isActiveChat
                ? 'bg-[#404040] text-white'
                : 'hover:bg-[#d97757] hover:text-white text-[#b8b8b8]'
            }`}
            title="AI对话"
          >
            <Bot className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 space-y-2">
      {/* 标题和新建按钮 */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-[#888] uppercase tracking-wider">
          AI对话
        </h3>
        <button
          onClick={createNewChat}
          className="p-1 text-[#888] hover:text-white hover:bg-[#404040] rounded transition-colors duration-200"
          title="新建对话"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* 对话列表 */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        <Link
          to="/chats"
          className={`block px-3 py-2 rounded-lg transition-colors duration-200 ${
            isActiveChat
              ? 'bg-[#404040] text-white'
              : 'hover:bg-[#404040] hover:text-white text-[#b8b8b8]'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Bot className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs truncate">当前对话</span>
          </div>
        </Link>

        {sessions.map(session => (
          <div
            key={session.id}
            className="relative group"
          >
            <Link
              to={`/chats?session=${session.id}`}
              className="block px-3 py-2 rounded-lg hover:bg-[#404040] hover:text-white transition-colors duration-200"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate text-white">
                    {session.title}
                  </span>
                  <span className="text-[10px] text-[#888] flex-shrink-0 ml-1">
                    {session.messageCount}
                  </span>
                </div>
                <div className="text-[10px] text-[#888] truncate">
                  {session.lastMessage}
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-[#666]">
                  <Clock className="w-2 h-2" />
                  <span>{formatTime(session.timestamp)}</span>
                </div>
              </div>
            </Link>
            
            {/* 删除按钮 */}
            <button
              onClick={(e) => deleteSession(session.id, e)}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-[#888] hover:text-red-400 transition-all duration-200"
              title="删除对话"
            >
              <Trash2 className="w-2 h-2" />
            </button>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-4">
          <MessageSquare className="w-8 h-8 text-[#666] mx-auto mb-2" />
          <p className="text-xs text-[#888]">暂无对话记录</p>
          <button
            onClick={createNewChat}
            className="text-xs text-[#d97757] hover:text-[#e08663] mt-1"
          >
            开始对话
          </button>
        </div>
      )}
    </div>
  )
}

export default ChatHistory