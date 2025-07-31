import React from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { HTTPMethod, APIStatus } from '@shared/types'
import { apiMethods } from '../utils/api'

interface CreateAPIModalProps {
  projectId: string
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  name: string
  method: HTTPMethod
  path: string
  description?: string
  status: APIStatus
}

const CreateAPIModal: React.FC<CreateAPIModalProps> = ({ projectId, onClose, onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    defaultValues: {
      method: HTTPMethod.GET,
      status: APIStatus.NOT_STARTED,
      path: '/'
    }
  })

  const method = watch('method')

  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiMethods.createAPI({ ...data, projectId }),
    onSuccess: () => {
      toast.success('API创建成功')
      reset()
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || '创建API失败')
    },
  })

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data)
  }

  const getMethodColor = (method: HTTPMethod) => {
    const colors = {
      [HTTPMethod.GET]: 'text-blue-600',
      [HTTPMethod.POST]: 'text-green-600',
      [HTTPMethod.PUT]: 'text-orange-600',
      [HTTPMethod.PATCH]: 'text-purple-600',
      [HTTPMethod.DELETE]: 'text-red-600',
      [HTTPMethod.HEAD]: 'text-gray-600',
      [HTTPMethod.OPTIONS]: 'text-gray-600',
    }
    return colors[method] || 'text-gray-600'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">添加新API</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* API Name */}
            <div>
              <label className="label">API名称 *</label>
              <input
                {...register('name', { required: 'API名称不能为空' })}
                type="text"
                className="input"
                placeholder="例如：获取用户列表"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Method and Path */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">HTTP方法 *</label>
                <select {...register('method')} className="input">
                  {Object.values(HTTPMethod).map((methodOption) => (
                    <option key={methodOption} value={methodOption}>
                      {methodOption}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">路径 *</label>
                <div className="flex">
                  <span className={`inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-sm font-medium ${getMethodColor(method)}`}>
                    {method}
                  </span>
                  <input
                    {...register('path', { required: '路径不能为空' })}
                    type="text"
                    className="input rounded-l-none border-l-0"
                    placeholder="/api/users"
                  />
                </div>
                {errors.path && (
                  <p className="mt-1 text-sm text-red-600">{errors.path.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label">描述</label>
              <textarea
                {...register('description')}
                rows={3}
                className="input resize-none"
                placeholder="描述这个API的功能（可选）"
              />
            </div>

            {/* Status */}
            <div>
              <label className="label">初始状态</label>
              <select {...register('status')} className="input">
                <option value={APIStatus.NOT_STARTED}>未开发</option>
                <option value={APIStatus.IN_PROGRESS}>开发中</option>
                <option value={APIStatus.COMPLETED}>已完成</option>
                <option value={APIStatus.NOT_TESTED}>未测试</option>
                <option value={APIStatus.TESTED}>已测试</option>
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
                {createMutation.isPending ? '创建中...' : '创建API'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateAPIModal