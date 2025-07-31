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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">删除项目</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              您即将删除项目 <span className="font-semibold text-gray-900">"{project.name}"</span>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              此操作将永久删除该项目及其所有相关数据，包括：
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>{project._count?.apis || 0} 个API接口</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>{project._count?.tags || 0} 个标签</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>所有相关的配置和数据</span>
              </li>
            </ul>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">警告</h4>
                  <p className="text-sm text-red-700">
                    此操作无法撤销。删除后，所有数据将永久丢失且无法恢复。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              请输入项目名称 <span className="text-red-600">"{project.name}"</span> 以确认删除：
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={`请输入 "${project.name}"`}
              disabled={isDeleting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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