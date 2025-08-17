import React, { useState, useEffect } from 'react'
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Download,
  Upload,
  Search,
  Filter,
  Eye,
  Code,
  Database,
  Settings,
  Tag,
  Clock,
  User,
  Star,
  StarOff,
  PlayCircle,
  X,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import {
  getCodeTemplates,
  createCodeTemplate,
  updateCodeTemplate,
  deleteCodeTemplate,
  renderCodeTemplate,
  importCodeTemplates,
  exportCodeTemplates
} from '../../../../utils/api'
import { toast } from 'react-hot-toast'
import CodeHighlight from '../../../common/CodeHighlight'

interface CodeTemplate {
  id: string
  name: string
  description: string
  category: string
  language: string
  content: string
  variables: Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'array'
    description: string
    defaultValue?: any
    required: boolean
  }>
  isBuiltIn: boolean
  isPublic: boolean
  isFavorite: boolean
  usageCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

interface TemplateFormData {
  name: string
  description: string
  category: string
  language: string
  content: string
  variables: Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'array'
    description: string
    defaultValue?: any
    required: boolean
  }>
  isPublic: boolean
  tags: string[]
}

interface CodeTemplateManagerProps {
  onClose: () => void
  onTemplateSelect?: (template: CodeTemplate) => void
}

const TEMPLATE_CATEGORIES = [
  { value: 'sql', label: 'SQL模板', icon: Database },
  { value: 'migration', label: '迁移脚本', icon: Code },
  { value: 'api', label: 'API代码', icon: FileText },
  { value: 'model', label: '数据模型', icon: Settings },
  { value: 'custom', label: '自定义', icon: Star }
]

const PROGRAMMING_LANGUAGES = [
  'SQL', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'PHP', 'Go', 'Rust', 'Other'
]

const VARIABLE_TYPES = ['string', 'number', 'boolean', 'array']

const CodeTemplateManager: React.FC<CodeTemplateManagerProps> = ({ 
  onClose, 
  onTemplateSelect 
}) => {
  const [templates, setTemplates] = useState<CodeTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<CodeTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<CodeTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<CodeTemplate | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewResult, setPreviewResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [languageFilter, setLanguageFilter] = useState<string>('')
  const [showBuiltIn, setShowBuiltIn] = useState(true)
  const [showFavorites, setShowFavorites] = useState(false)
  const [testVariables, setTestVariables] = useState<Record<string, any>>({})
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    category: 'sql',
    language: 'SQL',
    content: '',
    variables: [],
    isPublic: false,
    tags: []
  })

  // 加载模板列表
  useEffect(() => {
    loadTemplates()
  }, [])

  // 应用筛选
  useEffect(() => {
    let filtered = templates

    // 搜索筛选
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // 分类筛选
    if (categoryFilter) {
      filtered = filtered.filter(template => template.category === categoryFilter)
    }

    // 语言筛选
    if (languageFilter) {
      filtered = filtered.filter(template => template.language === languageFilter)
    }

    // 显示筛选
    if (!showBuiltIn) {
      filtered = filtered.filter(template => !template.isBuiltIn)
    }

    if (showFavorites) {
      filtered = filtered.filter(template => template.isFavorite)
    }

    setFilteredTemplates(filtered)
  }, [templates, searchQuery, categoryFilter, languageFilter, showBuiltIn, showFavorites])

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await getCodeTemplates()
      if (response.success && response.data) {
        setTemplates(response.data)
      }
    } catch (error) {
      console.error('加载代码模板失败:', error)
      toast.error('加载代码模板失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      description: '',
      category: 'sql',
      language: 'SQL',
      content: '',
      variables: [],
      isPublic: false,
      tags: []
    })
    setShowForm(true)
  }

  const handleEditTemplate = (template: CodeTemplate) => {
    if (template.isBuiltIn) {
      toast.error('内置模板不可编辑')
      return
    }
    
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      language: template.language,
      content: template.content,
      variables: template.variables,
      isPublic: template.isPublic,
      tags: template.tags
    })
    setShowForm(true)
  }

  const handleSubmitForm = async () => {
    try {
      if (editingTemplate) {
        const response = await updateCodeTemplate(editingTemplate.id, formData)
        if (response.success) {
          toast.success('模板更新成功')
        } else {
          throw new Error(response.error || '更新失败')
        }
      } else {
        const response = await createCodeTemplate(formData)
        if (response.success) {
          toast.success('模板创建成功')
        } else {
          throw new Error(response.error || '创建失败')
        }
      }
      
      setShowForm(false)
      loadTemplates()
    } catch (error: any) {
      console.error('保存模板失败:', error)
      toast.error('保存失败: ' + (error.message || '未知错误'))
    }
  }

  const handleDeleteTemplate = async (template: CodeTemplate) => {
    if (template.isBuiltIn) {
      toast.error('内置模板不可删除')
      return
    }

    if (!confirm(`确定要删除模板 "${template.name}" 吗？`)) {
      return
    }

    try {
      const response = await deleteCodeTemplate(template.id)
      if (response.success) {
        toast.success('模板删除成功')
        loadTemplates()
        if (selectedTemplate?.id === template.id) {
          setSelectedTemplate(null)
        }
      } else {
        throw new Error(response.error || '删除失败')
      }
    } catch (error: any) {
      console.error('删除模板失败:', error)
      toast.error('删除失败: ' + (error.message || '未知错误'))
    }
  }

  const handlePreviewTemplate = async (template: CodeTemplate, variables: Record<string, any>) => {
    try {
      const response = await renderCodeTemplate(template.id, variables)
      if (response.success && response.data) {
        setPreviewResult(response.data.content)
        setShowPreview(true)
      } else {
        throw new Error(response.error || '预览失败')
      }
    } catch (error: any) {
      console.error('预览模板失败:', error)
      toast.error('预览失败: ' + (error.message || '未知错误'))
    }
  }

  const handleUseTemplate = (template: CodeTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template)
      onClose()
    }
  }

  const addVariable = () => {
    setFormData(prev => ({
      ...prev,
      variables: [
        ...prev.variables,
        {
          name: '',
          type: 'string',
          description: '',
          required: true
        }
      ]
    }))
  }

  const removeVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }))
  }

  const updateVariable = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) =>
        i === index ? { ...variable, [field]: value } : variable
      )
    }))
  }

  const getCategoryIcon = (category: string) => {
    const categoryInfo = TEMPLATE_CATEGORIES.find(c => c.value === category)
    return categoryInfo ? categoryInfo.icon : FileText
  }

  const formatUsageCount = (count: number) => {
    if (count === 0) return '未使用'
    if (count === 1) return '1 次使用'
    return `${count} 次使用`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-header">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-text-primary">代码模板管理器</h2>
              <p className="text-text-secondary">管理和使用代码生成模板</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateTemplate}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>新建模板</span>
            </button>
            <button
              onClick={loadTemplates}
              className="btn-outline flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>刷新</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* 左侧：筛选和模板列表 */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            {/* 搜索和筛选 */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="space-y-3">
                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input w-full pl-10"
                    placeholder="搜索模板..."
                  />
                </div>

                {/* 筛选选项 */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="input text-sm"
                  >
                    <option value="">所有分类</option>
                    {TEMPLATE_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    className="input text-sm"
                  >
                    <option value="">所有语言</option>
                    {PROGRAMMING_LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 显示选项 */}
                <div className="flex items-center space-x-4 text-sm">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showBuiltIn}
                      onChange={(e) => setShowBuiltIn(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span>内置模板</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showFavorites}
                      onChange={(e) => setShowFavorites(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span>收藏</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 模板列表 */}
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-text-secondary">暂无匹配的模板</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTemplates.map((template) => {
                    const CategoryIcon = getCategoryIcon(template.category)
                    return (
                      <div
                        key={template.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <CategoryIcon className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-text-primary truncate flex items-center space-x-2">
                                <span>{template.name}</span>
                                {template.isBuiltIn && (
                                  <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                    内置
                                  </span>
                                )}
                                {template.isFavorite && (
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                )}
                              </h3>
                              <p className="text-sm text-text-secondary truncate">
                                {template.description}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs bg-gray-100 text-text-secondary px-2 py-1 rounded">
                                  {template.language}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatUsageCount(template.usageCount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：详情和编辑 */}
          <div className="flex-1 overflow-y-auto">
            {showForm ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-text-primary">
                    {editingTemplate ? '编辑' : '新建'}代码模板
                  </h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="btn-outline"
                  >
                    取消
                  </button>
                </div>

                <div className="space-y-6">
                  {/* 基础信息 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        模板名称 *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="input w-full"
                        placeholder="输入模板名称"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        分类 *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="input w-full"
                      >
                        {TEMPLATE_CATEGORIES.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        编程语言 *
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                        className="input w-full"
                      >
                        {PROGRAMMING_LANGUAGES.map(lang => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        标签
                      </label>
                      <input
                        type="text"
                        value={formData.tags.join(', ')}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                        }))}
                        className="input w-full"
                        placeholder="用逗号分隔多个标签"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      描述
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="input w-full h-20 resize-none"
                      placeholder="描述模板的用途和使用场景"
                    />
                  </div>

                  {/* 模板内容 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      模板内容 *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      className="input w-full h-48 font-mono text-sm"
                      placeholder="输入模板代码，使用 {{variableName}} 表示变量"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      使用双花括号 {`{{variableName}}`} 定义变量，变量需要在下方变量列表中声明
                    </p>
                  </div>

                  {/* 变量定义 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        模板变量
                      </label>
                      <button
                        type="button"
                        onClick={addVariable}
                        className="btn-outline text-sm flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>添加变量</span>
                      </button>
                    </div>
                    {formData.variables.length > 0 && (
                      <div className="space-y-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {formData.variables.map((variable, index) => (
                          <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded">
                            <div className="grid grid-cols-5 gap-2 flex-1">
                              <input
                                type="text"
                                value={variable.name}
                                onChange={(e) => updateVariable(index, 'name', e.target.value)}
                                className="input text-sm"
                                placeholder="变量名"
                              />
                              <select
                                value={variable.type}
                                onChange={(e) => updateVariable(index, 'type', e.target.value)}
                                className="input text-sm"
                              >
                                {VARIABLE_TYPES.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={variable.description}
                                onChange={(e) => updateVariable(index, 'description', e.target.value)}
                                className="input text-sm"
                                placeholder="描述"
                              />
                              <input
                                type="text"
                                value={variable.defaultValue || ''}
                                onChange={(e) => updateVariable(index, 'defaultValue', e.target.value)}
                                className="input text-sm"
                                placeholder="默认值"
                              />
                              <div className="flex items-center space-x-2">
                                <label className="flex items-center space-x-1">
                                  <input
                                    type="checkbox"
                                    checked={variable.required}
                                    onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                                    className="rounded border-gray-300"
                                  />
                                  <span className="text-xs">必填</span>
                                </label>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVariable(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 设置 */}
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isPublic}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">公开模板</span>
                    </label>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowForm(false)}
                      className="btn-outline"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSubmitForm}
                      className="btn-primary"
                    >
                      {editingTemplate ? '更新' : '创建'}
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedTemplate ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    {React.createElement(getCategoryIcon(selectedTemplate.category), {
                      className: "w-6 h-6 text-gray-500"
                    })}
                    <div>
                      <h3 className="text-lg font-medium text-text-primary flex items-center space-x-2">
                        <span>{selectedTemplate.name}</span>
                        {selectedTemplate.isBuiltIn && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                            内置
                          </span>
                        )}
                        {selectedTemplate.isFavorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </h3>
                      <p className="text-text-secondary">{selectedTemplate.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {onTemplateSelect && (
                      <button
                        onClick={() => handleUseTemplate(selectedTemplate)}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>使用模板</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const variables: Record<string, any> = {}
                        selectedTemplate.variables.forEach(v => {
                          variables[v.name] = testVariables[v.name] || v.defaultValue || ''
                        })
                        handlePreviewTemplate(selectedTemplate, variables)
                      }}
                      className="btn-outline flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>预览</span>
                    </button>
                    {!selectedTemplate.isBuiltIn && (
                      <>
                        <button
                          onClick={() => handleEditTemplate(selectedTemplate)}
                          className="btn-outline flex items-center space-x-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>编辑</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(selectedTemplate)}
                          className="btn-outline text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>删除</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* 模板信息 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-text-primary mb-3">模板信息</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-text-secondary">分类：</span>
                        <span className="font-medium">
                          {TEMPLATE_CATEGORIES.find(c => c.value === selectedTemplate.category)?.label}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-secondary">语言：</span>
                        <span className="font-medium">{selectedTemplate.language}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">使用次数：</span>
                        <span className="font-medium">{selectedTemplate.usageCount}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">创建时间：</span>
                        <span className="font-medium">
                          {new Date(selectedTemplate.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {selectedTemplate.tags.length > 0 && (
                      <div className="mt-3">
                        <span className="text-text-secondary text-sm">标签：</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedTemplate.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 模板变量 */}
                  {selectedTemplate.variables.length > 0 && (
                    <div className="bg-bg-paper rounded-lg border border-gray-200">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <h4 className="font-medium text-text-primary">模板变量</h4>
                      </div>
                      <div className="p-4 space-y-3">
                        {selectedTemplate.variables.map((variable, index) => (
                          <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
                            <div className="flex-1 grid grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="font-medium">{variable.name}</span>
                                {variable.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </div>
                              <div className="text-text-secondary">{variable.type}</div>
                              <div className="text-text-secondary">{variable.description}</div>
                              <div className="text-gray-500">
                                {variable.defaultValue || '-'}
                              </div>
                            </div>
                            <input
                              type="text"
                              value={testVariables[variable.name] || variable.defaultValue || ''}
                              onChange={(e) => setTestVariables(prev => ({
                                ...prev,
                                [variable.name]: e.target.value
                              }))}
                              className="input text-sm w-32"
                              placeholder="测试值"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 模板内容 */}
                  <div className="bg-bg-paper rounded-lg border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <h4 className="font-medium text-text-primary">模板内容</h4>
                    </div>
                    <div className="p-4">
                      <CodeHighlight
                        code={selectedTemplate.content}
                        language="sql"
                        showLineNumbers={true}
                        showCopyButton={true}
                        maxHeight="400px"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    选择代码模板
                  </h3>
                  <p className="text-text-secondary">
                    从左侧列表中选择一个模板查看详情
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 预览模态框 */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-text-primary">模板预览</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
                <CodeHighlight
                  code={previewResult}
                  language="sql"
                  showLineNumbers={true}
                  showCopyButton={true}
                  maxHeight="600px"
                />
              </div>
              <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
                <button
                  onClick={() => navigator.clipboard.writeText(previewResult)}
                  className="btn-outline flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>复制</span>
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="btn-primary"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CodeTemplateManager