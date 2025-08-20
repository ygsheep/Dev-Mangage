/**
 * API分组移动模态框组件
 * 提供API分组的移动、排序和层级调整功能
 */

import React from 'react';
import { Move, X } from 'lucide-react';

/**
 * 移动分组模态框组件的属性接口
 */
interface MoveGroupModalProps {
  /** 控制模态框是否显示 */
  isOpen: boolean;
  /** 关闭模态框的回调函数 */
  onClose: () => void;
  /** 要移动的分组对象 */
  group: any;
  /** 可供选择的目标分组列表 */
  groups?: any[];
  /** 移动成功后的回调函数 */
  onSuccess?: () => void;
}

/**
 * API分组移动模态框组件
 * 用于移动API分组到不同的父级分组或调整排序，当前处于开发阶段
 * @param props - 组件属性
 * @returns React函数组件
 */
export const MoveGroupModal: React.FC<MoveGroupModalProps> = ({
  isOpen,
  onClose,
  group,
  groups,
  onSuccess
}) => {
  // 如果模态框未打开则不渲染任何内容
  if (!isOpen) return null;

  return (
    // 模态框主容器和遮罩层
    <div className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* 背景遮罩层，点击可关闭模态框 */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* 模态框主体内容区域 */}
        <div className="relative transform overflow-hidden rounded-lg bg-bg-paper text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* 模态框头部 - 标题和关闭按钮 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary">移动分组</h3>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* 模态框主体内容 - 当前显示开发中状态 */}
          <div className="px-6 py-8">
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <Move size={48} className="text-text-tertiary" />
              <p className="text-text-secondary">
                移动表单开发中...
              </p>
              <p className="text-sm text-text-tertiary text-center">
                将支持分组移动、排序和层级调整功能
              </p>
            </div>
          </div>
          
          {/* 模态框底部 - 操作按钮区域 */}
          <div className="flex justify-end space-x-3 px-6 py-4 border-t border-border-primary bg-bg-tertiary">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-paper border border-border-primary rounded-md hover:bg-bg-tertiary transition-colors"
            >
              取消
            </button>
            {/* 移动按钮当前禁用，等待功能完善 */}
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md opacity-50 cursor-not-allowed"
            >
              移动
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};