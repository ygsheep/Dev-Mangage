import { Router, Request, Response } from 'express'
import fs from 'fs/promises'
import path from 'path'

const router = Router()

// 创建日志目录
const LOGS_DIR = path.join(process.cwd(), 'logs', 'debug')

// 确保日志目录存在
const ensureLogsDir = async () => {
  try {
    await fs.access(LOGS_DIR)
  } catch {
    await fs.mkdir(LOGS_DIR, { recursive: true })
  }
}

// 保存前端调试日志
router.post('/logs', async (req: Request, res: Response) => {
  try {
    await ensureLogsDir()
    
    const { version, timestamp, userAgent, url, logs } = req.body
    
    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({ error: '无效的日志数据' })
    }

    // 生成文件名
    const date = new Date(timestamp || Date.now())
    const filename = `debug-logs-${date.toISOString().replace(/[:.]/g, '-')}.json`
    const filepath = path.join(LOGS_DIR, filename)

    // 保存日志数据
    const logData = {
      version: version || '1.0',
      timestamp: timestamp || new Date().toISOString(),
      userAgent,
      url,
      logs,
      savedAt: new Date().toISOString(),
      savedBy: 'backend-api'
    }

    await fs.writeFile(filepath, JSON.stringify(logData, null, 2), 'utf8')

    res.json({
      success: true,
      message: '日志已保存',
      filename,
      filepath: filepath,
      logCount: logs.length
    })

  } catch (error) {
    console.error('保存调试日志失败:', error)
    res.status(500).json({
      error: '保存日志失败',
      details: error instanceof Error ? error.message : String(error)
    })
  }
})

// 获取保存的日志列表
router.get('/logs', async (req: Request, res: Response) => {
  try {
    await ensureLogsDir()
    
    const files = await fs.readdir(LOGS_DIR)
    const logFiles = files
      .filter(file => file.endsWith('.json') && file.startsWith('debug-logs-'))
      .sort((a, b) => b.localeCompare(a)) // 最新的在前
    
    const fileInfos = await Promise.all(
      logFiles.map(async (filename) => {
        const filepath = path.join(LOGS_DIR, filename)
        const stats = await fs.stat(filepath)
        
        try {
          const content = await fs.readFile(filepath, 'utf8')
          const data = JSON.parse(content)
          
          return {
            filename,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            logCount: data.logs?.length || 0,
            timestamp: data.timestamp,
            url: data.url
          }
        } catch {
          return {
            filename,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            logCount: 0,
            error: '无法解析日志文件'
          }
        }
      })
    )

    res.json({
      success: true,
      logsDirectory: LOGS_DIR,
      files: fileInfos,
      totalFiles: fileInfos.length
    })

  } catch (error) {
    console.error('获取日志列表失败:', error)
    res.status(500).json({
      error: '获取日志列表失败',
      details: error instanceof Error ? error.message : String(error)
    })
  }
})

// 下载特定的日志文件
router.get('/logs/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params
    
    // 安全检查
    if (!filename.endsWith('.json') || !filename.startsWith('debug-logs-') || filename.includes('..')) {
      return res.status(400).json({ error: '无效的文件名' })
    }

    const filepath = path.join(LOGS_DIR, filename)
    
    try {
      await fs.access(filepath)
    } catch {
      return res.status(404).json({ error: '文件不存在' })
    }

    res.download(filepath, filename)

  } catch (error) {
    console.error('下载日志文件失败:', error)
    res.status(500).json({
      error: '下载文件失败',
      details: error instanceof Error ? error.message : String(error)
    })
  }
})

export { router as debugRouter }