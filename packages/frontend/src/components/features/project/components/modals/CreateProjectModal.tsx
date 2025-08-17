import React from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { ProjectStatus } from '@shared/types'
import { apiMethods } from '../../../../../utils/api'

interface CreateProjectModalProps {
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  name: string
  description?: string
  status: ProjectStatus
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    defaultValues: {
      status: ProjectStatus.ACTIVE
    }
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiMethods.createProject(data),
    onSuccess: () => {
      toast.success('项目创建成功')
      reset()
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || '创建项目失败')
    },
  })

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-bg-paper px-4 pb-4 pt-5 text-left shadow-theme-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">创建新项目</h3>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Project Name */}
            <div>
              <label className="label">项目名称 *</label>
              <input
                {...register('name', { required: '项目名称不能为空' })}
                type="text"
                className="input"
                placeholder="输入项目名称"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="label">项目描述</label>
              <textarea
                {...register('description')}
                rows={3}
                className="input resize-none"
                placeholder="输入项目描述（可选）"
              />
            </div>

            {/* Status */}
            <div>
              <label className="label">状态</label>
              <select {...register('status')} className="input">
                <option value={ProjectStatus.ACTIVE}>活跃</option>
                <option value={ProjectStatus.ARCHIVED}>已归档</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={createMutation.isPending}
              >
                取消
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? '创建中...' : '创建项目'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateProjectModal