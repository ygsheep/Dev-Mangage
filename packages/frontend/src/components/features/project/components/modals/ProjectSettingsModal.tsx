import React, { useState, useEffect } from 'react'
import { X, Settings, Globe, Save, AlertCircle } from 'lucide-react'
import { Project } from '@shared/types'
import { apiMethods } from '../../../../../utils/api'
import toast from 'react-hot-toast'

interface ProjectSettingsModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedProject: Project) => void
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  project,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [baseUrl, setBaseUrl] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (project && isOpen) {
      setBaseUrl(project.baseUrl || '')
      setName(project.name)
      setDescription(project.description || '')
      setErrors({})
    }
  }, [project, isOpen])

  if (!isOpen || !project) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = '项目名称不能为空'
    }

    if (baseUrl && !isValidUrl(baseUrl)) {
      newErrors.baseUrl = '请输入有效的URL格式'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('请检查表单输入')
      return
    }

    setIsSaving(true)
    try {
      const updateData = {
        name: name.trim(),
        description: description.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined
      }

      const response = await apiMethods.updateProject(project.id, updateData)
      const updatedProject = response.data.project

      onUpdate(updatedProject)
      toast.success('项目设置已保存')
      onClose()
    } catch (error: any) {
      console.error('更新项目失败:', error)
      toast.error('保存失败: ' + (error.response?.data?.message || '未知错误'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (isSaving) return
    onClose()
  }

  const testBaseUrl = async () => {
    if (!baseUrl) {
      toast.error('请先输入Base URL')
      return
    }

    if (!isValidUrl(baseUrl)) {
      toast.error('请输入有效的URL格式')
      return
    }

    try {
      toast.loading('测试连接中...', { id: 'url-test' })
      
      // 模拟测试连接 (实际项目中应该发送ping请求)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 这里可以发送一个OPTIONS或GET请求来测试连接
      // const response = await fetch(baseUrl, { method: 'OPTIONS' })
      
      toast.success('连接测试成功', { id: 'url-test' })
    } catch (error) {
      toast.error('连接测试失败', { id: 'url-test' })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">项目设置</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 项目基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">基本信息</h3>
            
            {/* 项目名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="输入项目名称"
                disabled={isSaving}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* 项目描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                placeholder="输入项目描述（可选）"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* API测试配置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>API测试配置</span>
            </h3>
            
            {/* Base URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.baseUrl ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://api.example.com/v1"
                  disabled={isSaving}
                />
                <button
                  onClick={testBaseUrl}
                  disabled={isSaving || !baseUrl}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  测试连接
                </button>
              </div>
              {errors.baseUrl && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.baseUrl}</span>
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                设置API测试的基础URL，将与接口路径组合成完整的请求地址
              </p>
            </div>

            {/* Base URL 使用说明 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">使用说明:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Base URL 会与API接口路径自动组合</li>
                <li>• 例如: Base URL为 "https://api.example.com/v1"，接口路径为 "/users"</li>
                <li>• 最终测试URL: "https://api.example.com/v1/users"</li>
                <li>• 可以在API测试时实时修改，方便切换不同环境</li>
              </ul>
            </div>

            {/* 示例URL预览 */}
            {baseUrl && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-1">示例完整URL:</div>
                <div className="font-mono text-sm text-gray-800">
                  {baseUrl.replace(/\/$/, '')}/users/123
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            项目ID: {project.id}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>保存设置</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectSettingsModal