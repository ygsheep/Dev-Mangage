import React from 'react';
import { Code, X } from 'lucide-react';

interface CodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  endpoint: any;
}

export const CodeGeneratorModal: React.FC<CodeGeneratorModalProps> = ({
  isOpen,
  onClose,
  endpoint
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar">
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
            <h3 className="text-lg font-semibold text-text-primary">生成代码</h3>
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
              <Code size={48} className="text-text-tertiary" />
              <p className="text-text-secondary">
                代码生成器开发中...
              </p>
              <p className="text-sm text-text-tertiary text-center">
                将支持多种编程语言的客户端代码生成，包括JavaScript、Python、Java等
              </p>
            </div>
          </div>
          
          {/* Footer */}
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