import React, { useState } from 'react'
import { 
  X, 
  Plus,
  Calendar,
  User,
  Tag,
  Clock,
  AlertCircle,
  Code,
  Target
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface CreateFeatureModuleModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FeatureModuleFormData {
  name: string
  displayName: string
  description: string
  category: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  tags: string[]
  techStack: string[]
  estimatedHours: number | null
  assigneeName: string
  startDate: string
  dueDate: string
}

const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: '高优先级', color: 'bg-red-100 text-red-800' },
  { value: 'MEDIUM', label: '中优先级', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'LOW', label: '低优先级', color: 'bg-green-100 text-green-800' }
]

const CATEGORY_OPTIONS = [
  '用户管理',
  '权限控制',
  '数据模型',
  'API接口',
  '文件管理',
  '系统配置',
  '报表统计',
  '消息通知',
  '日志监控',
  '通用功能',
  '其他'
]

const COMMON_TECH_STACK = [
  'React',
  'TypeScript',
  'Node.js',
  'Express',
  'Prisma',
  'SQLite',
  'Tailwind CSS',
  'Vite',
  'JWT',
  'REST API',
  'WebSocket',
  'Redis',
  'Docker',
  'Git'
]

const CreateFeatureModuleModal: React.FC<CreateFeatureModuleModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FeatureModuleFormData>({
    name: '',
    displayName: '',
    description: '',
    category: '通用功能',
    priority: 'MEDIUM',
    tags: [],
    techStack: [],
    estimatedHours: null,
    assigneeName: '',
    startDate: '',
    dueDate: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newTag, setNewTag] = useState('')
  const [newTechStack, setNewTechStack] = useState('')

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '功能模块名称不能为空'
    } else if (formData.name.length > 100) {
      newErrors.name = '功能模块名称不能超过100个字符'
    }

    if (formData.displayName && formData.displayName.length > 100) {
      newErrors.displayName = '显示名称不能超过100个字符'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = '描述不能超过500个字符'
    }

    if (formData.estimatedHours !== null && formData.estimatedHours < 0) {
      newErrors.estimatedHours = '预估工时不能为负数'
    }

    if (formData.startDate && formData.dueDate && new Date(formData.startDate) > new Date(formData.dueDate)) {
      newErrors.dueDate = '结束日期不能早于开始日期'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const { createFeatureModule } = await import('../../../../../utils/api')
      
      const payload = {
        ...formData,
        tags: formData.tags,
        techStack: formData.techStack,
        estimatedHours: formData.estimatedHours || undefined,
        startDate: formData.startDate || undefined,
        dueDate: formData.dueDate || undefined,
        assigneeName: formData.assigneeName || undefined
      }

      const response = await createFeatureModule(projectId, payload)
      
      if (response.success) {
        toast.success('功能模块创建成功！')
        onSuccess()
        onClose()
        // 重置表单
        setFormData({
          name: '',
          displayName: '',
          description: '',
          category: '通用功能',
          priority: 'MEDIUM',
          tags: [],
          techStack: [],
          estimatedHours: null,
          assigneeName: '',
          startDate: '',
          dueDate: ''
        })
      } else {
        toast.error(response.message || '创建失败')
      }
    } catch (error: any) {
      console.error('创建功能模块失败:', error)
      toast.error(error.message || '创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  // 移除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  // 添加技术栈
  const handleAddTechStack = () => {
    if (newTechStack.trim() && !formData.techStack.includes(newTechStack.trim())) {
      setFormData(prev => ({
        ...prev,
        techStack: [...prev.techStack, newTechStack.trim()]
      }))
      setNewTechStack('')
    }
  }

  // 从预设选项添加技术栈
  const handleAddPresetTechStack = (tech: string) => {
    if (!formData.techStack.includes(tech)) {
      setFormData(prev => ({
        ...prev,
        techStack: [...prev.techStack, tech]
      }))
    }
  }

  // 移除技术栈
  const handleRemoveTechStack = (techToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(tech => tech !== techToRemove)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary bg-gradient-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">新建功能模块</h2>
              <p className="text-sm text-text-secondary">创建一个新的功能模块来组织相关的API和任务</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-140px)] overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span>基本信息</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 模块名称 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模块名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`input w-full ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="请输入功能模块名称"
                    maxLength={100}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>

                {/* 显示名称 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    显示名称
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    className={`input w-full ${errors.displayName ? 'border-red-500' : ''}`}
                    placeholder="可选，用于界面显示"
                    maxLength={100}
                  />
                  {errors.displayName && (
                    <p className="mt-1 text-sm text-red-500">{errors.displayName}</p>
                  )}
                </div>

                {/* 分类 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模块分类
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="input w-full"
                  >
                    {CATEGORY_OPTIONS.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* 优先级 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    优先级
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="input w-full"
                  >
                    {PRIORITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  模块描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={`input w-full h-24 resize-none ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="请描述这个功能模块的用途和功能"
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                  <p className="text-sm text-text-tertiary ml-auto">
                    {formData.description.length}/500
                  </p>
                </div>
              </div>
            </div>

            {/* 项目信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary flex items-center space-x-2">
                <User className="w-5 h-5 text-green-500" />
                <span>项目信息</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 负责人 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    负责人
                  </label>
                  <input
                    type="text"
                    value={formData.assigneeName}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigneeName: e.target.value }))}
                    className="input w-full"
                    placeholder="指定负责人"
                  />
                </div>

                {/* 预估工时 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    预估工时 (小时)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.estimatedHours || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      estimatedHours: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                    className={`input w-full ${errors.estimatedHours ? 'border-red-500' : ''}`}
                    placeholder="0"
                  />
                  {errors.estimatedHours && (
                    <p className="mt-1 text-sm text-red-500">{errors.estimatedHours}</p>
                  )}
                </div>

                <div></div>

                {/* 开始日期 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="input w-full"
                  />
                </div>

                {/* 结束日期 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className={`input w-full ${errors.dueDate ? 'border-red-500' : ''}`}
                  />
                  {errors.dueDate && (
                    <p className="mt-1 text-sm text-red-500">{errors.dueDate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 标签 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary flex items-center space-x-2">
                <Tag className="w-5 h-5 text-purple-500" />
                <span>标签</span>
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="input flex-1"
                  placeholder="输入标签名称"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn-outline"
                >
                  添加
                </button>
              </div>
            </div>

            {/* 技术栈 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary flex items-center space-x-2">
                <Code className="w-5 h-5 text-orange-500" />
                <span>技术栈</span>
              </h3>
              
              {/* 已选技术栈 */}
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.techStack.map(tech => (
                  <span
                    key={tech}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleRemoveTechStack(tech)}
                      className="ml-2 hover:text-green-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              {/* 添加自定义技术栈 */}
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newTechStack}
                  onChange={(e) => setNewTechStack(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTechStack())}
                  className="input flex-1"
                  placeholder="输入技术栈名称"
                />
                <button
                  type="button"
                  onClick={handleAddTechStack}
                  className="btn-outline"
                >
                  添加
                </button>
              </div>
              
              {/* 常用技术栈快选 */}
              <div>
                <p className="text-sm text-text-secondary mb-2">常用技术栈：</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TECH_STACK.filter(tech => !formData.techStack.includes(tech)).map(tech => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => handleAddPresetTechStack(tech)}
                      className="px-2 py-1 text-xs bg-bg-tertiary hover:bg-bg-secondary rounded border border-border-primary hover:border-border-secondary transition-colors"
                    >
                      + {tech}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border-primary bg-bg-tertiary">
          <div className="text-sm text-text-tertiary">
            * 必填字段
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={loading}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.name.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>创建中...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>创建模块</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateFeatureModuleModal