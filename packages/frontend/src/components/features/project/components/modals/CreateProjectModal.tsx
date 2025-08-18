/**
 * 创建项目模态框组件
 * 提供创建新项目的表单界面，包括项目名称、描述和状态设置
 */

import React from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { ProjectStatus } from '@shared/types'
import { apiMethods } from '../../../../../utils/api'

/**
 * 创建项目模态框组件的属性接口
 */
interface CreateProjectModalProps {
  /** 关闭模态框的回调函数 */
  onClose: () => void
  /** 项目创建成功后的回调函数 */
  onSuccess: () => void
}

/**
 * 表单数据类型定义
 */
interface FormData {
  /** 项目名称（必填） */
  name: string
  /** 项目描述（可选） */
  description?: string
  /** 项目状态 */
  status: ProjectStatus
}

/**
 * 创建项目模态框组件
 * 使用React Hook Form进行表单管理和React Query进行数据提交
 * @param props - 组件属性
 * @returns React函数组件
 */
const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onSuccess }) => {
  // 初始化表单管理，设置默认值为活跃状态
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    defaultValues: {
      status: ProjectStatus.ACTIVE
    }
  })

  // 创建项目的异步请求管理
  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiMethods.createProject(data),
    onSuccess: () => {
      toast.success('项目创建成功')
      reset() // 重置表单
      onSuccess() // 触发成功回调
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || '创建项目失败')
    },
  })

  /**
   * 表单提交处理函数
   * @param data - 验证通过的表单数据
   */
  const onSubmit = (data: FormData) => {
    createMutation.mutate(data)
  }

  return (
    // 模态框容器和遮罩层
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* 背景遮罩，点击关闭模态框 */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        {/* 模态框主体 */}
        <div className="relative transform overflow-hidden rounded-lg bg-bg-paper px-4 pb-4 pt-5 text-left shadow-theme-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* 模态框头部 - 标题和关闭按钮 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">创建新项目</h3>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 创建项目表单 */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 项目名称输入框（必填字段） */}
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

            {/* 项目描述输入框（可选字段） */}
            <div>
              <label className="label">项目描述</label>
              <textarea
                {...register('description')}
                rows={3}
                className="input resize-none"
                placeholder="输入项目描述（可选）"
              />
            </div>

            {/* 项目状态选择框 */}
            <div>
              <label className="label">状态</label>
              <select {...register('status')} className="input">
                <option value={ProjectStatus.ACTIVE}>活跃</option>
                <option value={ProjectStatus.ARCHIVED}>已归档</option>
              </select>
            </div>

            {/* 操作按钮组 */}
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