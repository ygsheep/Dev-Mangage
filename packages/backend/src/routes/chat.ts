import express from 'express'
import { spawn } from 'child_process'
import { body, validationResult } from 'express-validator'

const router = express.Router()

interface ChatSession {
  id: string
  process?: any
  lastActivity: Date
}

// 存储活动的聊天会话
const activeSessions = new Map<string, ChatSession>()

// 清理过期会话
const cleanupExpiredSessions = () => {
  const now = new Date()
  const expiredThreshold = 30 * 60 * 1000 // 30分钟

  for (const [sessionId, session] of activeSessions.entries()) {
    if (now.getTime() - session.lastActivity.getTime() > expiredThreshold) {
      if (session.process) {
        session.process.kill()
      }
      activeSessions.delete(sessionId)
      console.log(`已清理过期会话: ${sessionId}`)
    }
  }
}

// 每10分钟清理一次过期会话
setInterval(cleanupExpiredSessions, 10 * 60 * 1000)

/**
 * @route POST /api/v1/chat
 * @desc 与AI助手对话
 * @access Public
 */
router.post(
  '/',
  [
    body('message').notEmpty().withMessage('消息内容不能为空'),
    body('sessionId').notEmpty().withMessage('会话ID不能为空'),
    body('provider').optional().isIn(['gemini', 'openai', 'claude']).withMessage('不支持的AI提供商'),
  ],
  async (req, res) => {
    try {
      // 验证请求参数
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '请求参数验证失败',
          errors: errors.array(),
        })
      }

      const { message, sessionId, provider = 'gemini' } = req.body

      // 设置SSE响应头
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control')

      let session = activeSessions.get(sessionId)
      
      if (!session) {
        session = {
          id: sessionId,
          lastActivity: new Date()
        }
        activeSessions.set(sessionId, session)
      }

      session.lastActivity = new Date()

      try {
        if (provider === 'gemini') {
          // 使用Gemini CLI
          await handleGeminiChat(message, session, res)
        } else {
          // 其他AI提供商的处理逻辑
          res.write(`data: ${JSON.stringify({ error: '暂不支持该AI提供商' })}\n\n`)
          res.end()
        }
      } catch (error) {
        console.error('AI对话处理错误:', error)
        res.write(`data: ${JSON.stringify({ 
          error: error instanceof Error ? error.message : '未知错误' 
        })}\n\n`)
        res.end()
      }

    } catch (error) {
      console.error('聊天API错误:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error instanceof Error ? error.message : '未知错误',
      })
    }
  }
)

/**
 * 处理Gemini CLI对话
 */
async function handleGeminiChat(message: string, session: ChatSession, res: express.Response) {
  return new Promise<void>((resolve, reject) => {
    try {
      // 检查gemini命令是否可用
      const geminiProcess = spawn('gemini', ['--help'], { 
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true 
      })

      geminiProcess.on('error', (error) => {
        console.error('Gemini CLI不可用:', error)
        // 使用模拟响应
        handleMockGeminiResponse(message, res)
        resolve()
      })

      geminiProcess.on('close', (code) => {
        if (code === 0) {
          // Gemini CLI可用，使用真实API
          handleRealGeminiChat(message, session, res)
            .then(resolve)
            .catch(reject)
        } else {
          // Gemini CLI不可用，使用模拟响应
          handleMockGeminiResponse(message, res)
          resolve()
        }
      })

      // 设置超时
      setTimeout(() => {
        geminiProcess.kill()
        handleMockGeminiResponse(message, res)
        resolve()
      }, 2000)

    } catch (error) {
      console.error('Gemini检查失败:', error)
      handleMockGeminiResponse(message, res)
      resolve()
    }
  })
}

/**
 * 使用真实的Gemini CLI
 */
async function handleRealGeminiChat(message: string, session: ChatSession, res: express.Response) {
  return new Promise<void>((resolve, reject) => {
    try {
      const geminiProcess = spawn('gemini', ['-'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      })

      let responseBuffer = ''
      let hasStarted = false

      geminiProcess.stdout.on('data', (data) => {
        const chunk = data.toString()
        responseBuffer += chunk

        // 模拟流式输出
        const words = chunk.split(' ')
        words.forEach((word, index) => {
          setTimeout(() => {
            if (!hasStarted) {
              hasStarted = true
              res.write(`data: ${JSON.stringify({ content: word + ' ' })}\n\n`)
            } else {
              res.write(`data: ${JSON.stringify({ content: word + ' ' })}\n\n`)
            }
          }, index * 50)
        })
      })

      geminiProcess.stderr.on('data', (data) => {
        console.error('Gemini CLI错误:', data.toString())
      })

      geminiProcess.on('close', (code) => {
        if (code === 0) {
          res.write(`data: ${JSON.stringify({ finished: true })}\n\n`)
        } else {
          res.write(`data: ${JSON.stringify({ error: 'Gemini CLI执行失败' })}\n\n`)
        }
        res.end()
        resolve()
      })

      geminiProcess.on('error', (error) => {
        console.error('Gemini进程错误:', error)
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
        res.end()
        reject(error)
      })

      // 发送消息到Gemini
      geminiProcess.stdin.write(message + '\n')
      geminiProcess.stdin.end()

      // 设置超时
      setTimeout(() => {
        if (!geminiProcess.killed) {
          geminiProcess.kill()
          res.write(`data: ${JSON.stringify({ error: '请求超时' })}\n\n`)
          res.end()
          resolve()
        }
      }, 30000) // 30秒超时

    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 模拟Gemini响应（当CLI不可用时）
 */
function handleMockGeminiResponse(message: string, res: express.Response) {
  // 模拟的智能回复
  const mockResponses = [
    `您好！我理解您想了解关于"${message}"的信息。`,
    `\n\n作为DevAPI Manager的AI助手，我可以帮助您：`,
    `\n\n**🚀 项目开发**`,
    `\n- API接口设计和文档生成`,
    `\n- 数据库模型设计`,
    `\n- 代码生成和优化建议`,
    `\n\n**📊 数据管理**`, 
    `\n- 数据模型分析`,
    `\n- SQL查询优化`,
    `\n- 数据迁移方案`,
    `\n\n**🔧 工具集成**`,
    `\n- Swagger文档导入`,
    `\n- 批量数据处理`,
    `\n- 自动化测试建议`,
    `\n\n请告诉我您具体需要什么帮助，我会提供更详细的解决方案。`,
    `\n\n---`,
    `\n*注意：当前使用模拟响应模式。要启用完整的Gemini功能，请安装并配置Gemini CLI。*`
  ]

  let currentIndex = 0
  
  const sendChunk = () => {
    if (currentIndex < mockResponses.length) {
      res.write(`data: ${JSON.stringify({ content: mockResponses[currentIndex] })}\n\n`)
      currentIndex++
      setTimeout(sendChunk, 100 + Math.random() * 200) // 模拟打字效果
    } else {
      res.write(`data: ${JSON.stringify({ finished: true })}\n\n`)
      res.end()
    }
  }

  setTimeout(sendChunk, 500) // 稍微延迟开始，模拟思考时间
}

/**
 * @route DELETE /api/v1/chat/:sessionId
 * @desc 结束聊天会话
 * @access Public
 */
router.delete('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params
    const session = activeSessions.get(sessionId)
    
    if (session) {
      if (session.process) {
        session.process.kill()
      }
      activeSessions.delete(sessionId)
    }

    res.json({
      success: true,
      message: '会话已结束',
    })
  } catch (error) {
    console.error('结束会话错误:', error)
    res.status(500).json({
      success: false,
      message: '结束会话失败',
      error: error instanceof Error ? error.message : '未知错误',
    })
  }
})

/**
 * @route GET /api/v1/chat/sessions
 * @desc 获取活动会话列表
 * @access Public
 */
router.get('/sessions', (req, res) => {
  try {
    const sessions = Array.from(activeSessions.entries()).map(([id, session]) => ({
      id,
      lastActivity: session.lastActivity,
      isActive: !!session.process
    }))

    res.json({
      success: true,
      data: {
        sessions,
        total: sessions.length
      }
    })
  } catch (error) {
    console.error('获取会话列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取会话列表失败',
      error: error instanceof Error ? error.message : '未知错误',
    })
  }
})

export default router