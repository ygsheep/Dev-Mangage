import React, { useState } from 'react'
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { Project } from '@shared/types'

interface DeleteProjectModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (projectId: string) => Promise<void>
}

const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  if (!isOpen || !project) return null

  const isConfirmValid = confirmName === project.name

  const handleConfirm = async () => {
    if (!isConfirmValid || isDeleting) return

    setIsDeleting(true)
    try {
      await onConfirm(project.id)
      onClose()
    } catch (error) {
      console.error('Delete project failed:', error)
    } finally {
      setIsDeleting(false)
      setConfirmName('')
    }
  }

  const handleClose = () => {
    if (isDeleting) return
    setConfirmName('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-theme-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-error-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-error-600" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">删除项目</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="p-1 hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-text-secondary mb-2">
              您即将删除项目 <span className="font-semibold text-text-primary">"{project.name}"</span>
            </p>
            <p className="text-sm text-text-secondary mb-4">
              此操作将永久删除该项目及其所有相关数据，包括：
            </p>
            <ul className="text-sm text-text-secondary space-y-1 mb-4">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-text-tertiary rounded-full"></div>
                <span>{project._count?.apis || 0} 个API接口</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-text-tertiary rounded-full"></div>
                <span>{project._count?.tags || 0} 个标签</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-text-tertiary rounded-full"></div>
                <span>所有相关的配置和数据</span>
              </li>
            </ul>
            <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-error-800 mb-1">警告</h4>
                  <p className="text-sm text-error-700">
                    此操作无法撤销。删除后，所有数据将永久丢失且无法恢复。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              请输入项目名称 <span className="text-error-600">"{project.name}"</span> 以确认删除：
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={`请输入 "${project.name}"`}
              disabled={isDeleting}
              className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-error-500 focus:border-error-500 disabled:opacity-50 disabled:cursor-not-allowed"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border-primary bg-bg-tertiary">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-paper border border-border-primary rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-error-600 rounded-lg hover:bg-error-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>删除中...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>确认删除</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteProjectModal