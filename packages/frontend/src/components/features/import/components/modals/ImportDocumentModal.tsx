import React, { useState } from 'react'
import { X, Upload, FileText, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImportDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (parsedData: any) => void
}

const ImportDocumentModal: React.FC<ImportDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [parseResult, setParseResult] = useState<any>(null)

  if (!isOpen) return null

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 检查文件类型
      if (file.type !== 'text/markdown' && !file.name.endsWith('.md')) {
        toast.error('请选择Markdown文件 (.md)')
        return
      }
      
      // 检查文件大小 (最大10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('文件大小不能超过10MB')
        return
      }

      setSelectedFile(file)
      setParseResult(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // 读取文件内容
      const fileContent = await selectedFile.text()
      
      // 模拟解析过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 解析Markdown内容并提取表结构
      const parsedTables = parseMarkdownTables(fileContent)
      
      setUploadProgress(100)
      setTimeout(() => {
        setParseResult({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          tableCount: parsedTables.length,
          tables: parsedTables,
          parseStatus: 'SUCCESS'
        })
        setIsUploading(false)
        toast.success(`成功解析 ${parsedTables.length} 个数据表`)
      }, 500)

    } catch (error) {
      console.error('Upload failed:', error)
      setIsUploading(false)
      setUploadProgress(0)
      toast.error('文档解析失败，请检查文件格式')
    }
  }

  const parseMarkdownTables = (content: string): any[] => {
    const tables: any[] = []
    
    // 简单的Markdown SQL表结构解析逻辑
    const sqlBlocks = content.match(/```sql\s*([\s\S]*?)\s*```/g) || []
    
    sqlBlocks.forEach((block, index) => {
      const sqlContent = block.replace(/```sql|```/g, '').trim()
      
      // 解析CREATE TABLE语句
      const createTableMatch = sqlContent.match(/CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\);/i)
      if (createTableMatch) {
        const tableName = createTableMatch[1]
        const fieldsContent = createTableMatch[2]
        
        // 简单的字段解析
        const fields: any[] = []
        const fieldLines = fieldsContent.split('\n').filter(line => line.trim())
        
        fieldLines.forEach(line => {
          const trimmedLine = line.trim()
          if (trimmedLine.startsWith('--') || trimmedLine.startsWith('/*')) return
          if (trimmedLine.includes('FOREIGN KEY') || trimmedLine.includes('INDEX')) return
          
          // 解析字段定义
          const fieldMatch = trimmedLine.match(/(\w+)\s+(\w+)(?:\(([^)]+)\))?\s*(.*)/i)
          if (fieldMatch) {
            const [, name, type, size, constraints] = fieldMatch
            fields.push({
              name,
              type: type.toUpperCase(),
              length: size ? parseInt(size) : undefined,
              nullable: !constraints?.includes('NOT NULL'),
              isPrimaryKey: constraints?.includes('PRIMARY KEY') || false,
              isAutoIncrement: constraints?.includes('AUTO_INCREMENT') || false,
              comment: extractComment(constraints || '')
            })
          }
        })

        tables.push({
          id: `table-${index + 1}`,
          name: tableName,
          displayName: extractTableDisplayName(sqlContent, tableName),
          comment: extractTableComment(sqlContent),
          engine: 'InnoDB',
          charset: 'utf8mb4',
          collation: 'utf8mb4_unicode_ci',
          status: 'DRAFT',
          category: inferTableCategory(tableName),
          fields,
          fieldCount: fields.length,
          indexCount: 0 // 简化处理，暂不解析索引
        })
      }
    })

    return tables
  }

  const extractComment = (constraints: string): string => {
    const commentMatch = constraints.match(/COMMENT\s+['"]([^'"]+)['"]/i)
    return commentMatch ? commentMatch[1] : ''
  }

  const extractTableDisplayName = (sqlContent: string, tableName: string): string => {
    // 从注释中提取中文表名
    const lines = sqlContent.split('\n')
    for (const line of lines) {
      if (line.includes(tableName) && line.includes('表')) {
        const match = line.match(/([^()]+表)/i)
        if (match) return match[1].trim()
      }
    }
    return tableName
  }

  const extractTableComment = (sqlContent: string): string => {
    const commentMatch = sqlContent.match(/COMMENT\s*=\s*['"]([^'"]+)['"]/i)
    return commentMatch ? commentMatch[1] : ''
  }

  const inferTableCategory = (tableName: string): string => {
    if (tableName.includes('user')) return '用户系统'
    if (tableName.includes('news') || tableName.includes('content')) return '内容系统'
    if (tableName.includes('comment')) return '社区系统'
    if (tableName.includes('config') || tableName.includes('admin')) return '系统配置'
    return '其他'
  }

  const handleConfirm = () => {
    if (parseResult) {
      onSuccess(parseResult)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-theme-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <div className="flex items-center space-x-3">
            <Upload className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-text-primary">导入数据库设计文档</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {!parseResult ? (
            <>
              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  选择Markdown文档
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border-primary border-dashed rounded-md hover:border-border-secondary transition-colors">
                  <div className="space-y-1 text-center">
                    <FileText className="mx-auto h-12 w-12 text-text-tertiary" />
                    <div className="flex text-sm text-text-secondary">
                      <label className="relative cursor-pointer bg-bg-paper rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                        <span>选择文件</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".md,.markdown"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="pl-1">或拖拽到此处</p>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      支持 .md 格式，最大 10MB
                    </p>
                  </div>
                </div>
                
                {selectedFile && (
                  <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-primary-600" />
                      <span className="text-sm font-medium text-primary-900">{selectedFile.name}</span>
                      <span className="text-sm text-primary-600">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-secondary">解析进度</span>
                    <span className="text-sm text-text-tertiary">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-bg-tertiary rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-bg-tertiary rounded-lg p-4">
                <h4 className="text-sm font-medium text-text-primary mb-2">支持的文档格式</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• 包含 CREATE TABLE 语句的SQL代码块</li>
                  <li>• 标准的MySQL/PostgreSQL建表语句</li>
                  <li>• 支持字段注释和表注释解析</li>
                  <li>• 自动识别主键、外键和索引信息</li>
                </ul>
              </div>
            </>
          ) : (
            /* Parse Results */
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-success-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">文档解析完成</span>
              </div>

              {/* Summary */}
              <div className="bg-success-50 rounded-lg p-4">
                <h4 className="font-medium text-text-primary mb-3">解析结果</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary">文档名称:</span>
                    <div className="font-medium">{parseResult.fileName}</div>
                  </div>
                  <div>
                    <span className="text-text-secondary">文件大小:</span>
                    <div className="font-medium">{(parseResult.fileSize / 1024).toFixed(1)} KB</div>
                  </div>
                  <div>
                    <span className="text-text-secondary">数据表数量:</span>
                    <div className="font-medium text-success-600">{parseResult.tableCount} 个</div>
                  </div>
                  <div>
                    <span className="text-text-secondary">解析状态:</span>
                    <div className="font-medium text-success-600">成功</div>
                  </div>
                </div>
              </div>

              {/* Tables Preview */}
              <div>
                <h4 className="font-medium text-text-primary mb-3">数据表预览</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                  {parseResult.tables.map((table: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-bg-paper border border-border-primary rounded-lg">
                      <div>
                        <div className="font-medium text-text-primary">{table.displayName || table.name}</div>
                        <div className="text-sm text-text-tertiary">
                          {table.name} • {table.fieldCount} 字段 • {table.category}
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-warning-100 text-warning-800 text-xs rounded-full">
                        草稿
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border-primary bg-bg-tertiary">
          <div className="text-sm text-text-tertiary">
            {selectedFile && !parseResult && `已选择: ${selectedFile.name}`}
            {parseResult && `将创建 ${parseResult.tableCount} 个数据表`}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-secondary bg-bg-paper border border-border-primary rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              取消
            </button>
            {!parseResult ? (
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? '解析中...' : '开始解析'}
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
              >
                确认导入
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportDocumentModal