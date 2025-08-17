import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Folder, X, Info, Settings, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAPIGroups } from '../../../../hooks/useAPIGroups';

interface EditAPIGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: any;
  groups?: any[];
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  description: string;
  parentGroupId?: string;
  sortOrder: number;
  isPublic: boolean;
  tags: string[];
}

export const EditAPIGroupModal: React.FC<EditAPIGroupModalProps> = ({
  isOpen,
  onClose,
  group,
  groups = [],
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const { updateGroup } = useAPIGroups(group?.projectId);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>();

  const watchedTags = watch('tags') || [];

  // 当group变化时，重新填充表单数据
  useEffect(() => {
    if (group && isOpen) {
      reset({
        name: group.name || '',
        description: group.description || '',
        parentGroupId: group.parentGroupId || '',
        sortOrder: group.sortOrder || 0,
        isPublic: group.isPublic !== undefined ? group.isPublic : true,
        tags: group.tags || []
      });
    }
  }, [group, isOpen, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await updateGroup(group.id, {
        ...data,
        updatedAt: new Date()
      });
      
      toast.success('API分组更新成功');
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('更新API分组失败:', error);
      toast.error('更新API分组失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      setValue('tags', [...watchedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen || !group) return null;

  // 过滤可用的父分组选项（不能选择自己或子分组）
  const availableParentGroups = groups.filter(g => 
    g.id !== group.id && !g.parentGroupId?.startsWith(group.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <div className="flex items-center space-x-3">
            <Edit className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-text-primary">编辑API分组</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary">基本信息</h3>
              
              {/* 分组名称 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  分组名称 <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="name"
                  control={control}
                  rules={{ 
                    required: '请输入分组名称',
                    minLength: { value: 2, message: '分组名称至少2个字符' },
                    maxLength: { value: 50, message: '分组名称不能超过50个字符' }
                  }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-300' : 'border-border-primary'
                      }`}
                      placeholder="请输入分组名称"
                    />
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* 分组描述 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  分组描述
                </label>
                <Controller
                  name="description"
                  control={control}
                  rules={{ 
                    maxLength: { value: 200, message: '描述不能超过200个字符' }
                  }}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                        errors.description ? 'border-red-300' : 'border-border-primary'
                      }`}
                      placeholder="请输入分组描述（可选）"
                    />
                  )}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* 父分组选择 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  父分组
                </label>
                <Controller
                  name="parentGroupId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">无父分组（根级分组）</option>
                      {availableParentGroups.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <div className="mt-1 flex items-center space-x-1 text-xs text-text-tertiary">
                  <Info className="w-3 h-3" />
                  <span>选择父分组可以创建层级结构</span>
                </div>
              </div>
            </div>

            {/* 高级设置 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>高级设置</span>
              </h3>
              
              {/* 排序顺序 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  排序顺序
                </label>
                <Controller
                  name="sortOrder"
                  control={control}
                  rules={{ 
                    min: { value: 0, message: '排序顺序不能小于0' },
                    max: { value: 9999, message: '排序顺序不能大于9999' }
                  }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="0"
                      max="9999"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.sortOrder ? 'border-red-300' : 'border-border-primary'
                      }`}
                      placeholder="0"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
                {errors.sortOrder && (
                  <p className="mt-1 text-sm text-red-600">{errors.sortOrder.message}</p>
                )}
                <p className="mt-1 text-xs text-text-tertiary">数字越小排序越靠前</p>
              </div>

              {/* 可见性设置 */}
              <div>
                <label className="flex items-center space-x-3">
                  <Controller
                    name="isPublic"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4 text-blue-600 border-border-primary rounded focus:ring-blue-500"
                      />
                    )}
                  />
                  <span className="text-sm font-medium text-text-secondary">公开分组</span>
                </label>
                <p className="mt-1 text-xs text-text-tertiary ml-7">
                  公开分组对所有项目成员可见，私有分组仅对创建者可见
                </p>
              </div>

              {/* 标签管理 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  标签
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入标签名称"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      添加
                    </button>
                  </div>
                  
                  {watchedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {watchedTags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 警告信息 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">注意事项：</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>修改分组名称会影响所有子分组和关联的API接口</li>
                    <li>调整父分组可能会改变分组的层级结构</li>
                    <li>私有分组将不会被其他项目成员看到</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-border-primary bg-bg-tertiary">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-text-secondary bg-bg-paper border border-border-primary rounded-lg hover:bg-bg-tertiary disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              )}
              <span>{loading ? '保存中...' : '保存修改'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};