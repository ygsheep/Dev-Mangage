import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: Array<{
    type: string;
    tableId?: string;
    endpointId?: string;
    description: string;
    resolution?: string;
  }>;
  onResolve: (resolutions: any[]) => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  onResolve
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-bg-paper text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary">解决同步冲突</h3>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Body */}
          <div className="px-6 py-8">
            <div className="flex flex-col items-center justify-center h-72 space-y-4">
              <AlertTriangle size={48} className="text-orange-500" />
              <p className="text-text-secondary">
                冲突解决界面开发中...
              </p>
              <p className="text-sm text-text-tertiary">
                发现 {conflicts.length} 个冲突需要处理
              </p>
              <p className="text-sm text-text-tertiary text-center">
                将提供智能冲突检测和解决方案，支持手动处理、自动合并等策略
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-end space-x-3 px-6 py-4 border-t border-border-primary bg-bg-tertiary">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-paper border border-border-primary rounded-md hover:bg-bg-tertiary transition-colors"
            >
              取消
            </button>
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md opacity-50 cursor-not-allowed"
            >
              解决冲突
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};