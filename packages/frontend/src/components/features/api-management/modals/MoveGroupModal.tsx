import React from 'react';
import { Move, X } from 'lucide-react';

interface MoveGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: any;
  groups?: any[];
  onSuccess?: () => void;
}

export const MoveGroupModal: React.FC<MoveGroupModalProps> = ({
  isOpen,
  onClose,
  group,
  groups,
  onSuccess
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
        <div className="relative transform overflow-hidden rounded-lg bg-bg-paper text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary">移动分组</h3>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Body */}
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