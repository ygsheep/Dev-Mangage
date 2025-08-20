/**
 * API接口测试模态框组件
 * 提供API接口的测试功能，包括参数配置、请求发送和响应展示
 */

import React from 'react';
import { Play, X } from 'lucide-react';

/**
 * TestAPIModal组件的属性接口
 */
interface TestAPIModalProps {
  /** 控制模态框是否显示 */
  isOpen: boolean;
  /** 关闭模态框的回调函数 */
  onClose: () => void;
  /** 要测试的API端点信息 */
  endpoint: any;
}

/**
 * API接口测试模态框组件
 * 用于测试API接口的功能模态框，当前处于开发阶段
 * @param props - 组件属性
 * @returns React函数组件
 */
export const TestAPIModal: React.FC<TestAPIModalProps> = ({
  isOpen,
  onClose,
  endpoint
}) => {
  // 如果模态框未打开则不渲染任何内容
  if (!isOpen) return null;

  return (
    // 模态框遮罩层和主容器
    <div className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* 背景遮罩层，点击可关闭模态框 */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* 模态框主体内容区域 */}
        <div className="relative transform overflow-hidden rounded-lg bg-bg-paper text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          {/* 模态框头部 - 标题和关闭按钮 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary">测试API接口</h3>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* 模态框主体内容 - 当前显示开发中状态 */}
          <div className="px-6 py-8">
            <div className="flex flex-col items-center justify-center h-72 space-y-4">
              <Play size={48} className="text-text-tertiary" />
              <p className="text-text-secondary">
                API测试工具开发中...
              </p>
              <p className="text-sm text-text-tertiary text-center">
                将提供完整的API测试功能，包括参数配置、请求发送、响应展示等
              </p>
            </div>
          </div>
          
          {/* 模态框底部 - 操作按钮区域 */}
          <div className="flex justify-end px-6 py-4 border-t border-border-primary bg-bg-tertiary">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-paper border border-border-primary rounded-md hover:bg-bg-tertiary transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};