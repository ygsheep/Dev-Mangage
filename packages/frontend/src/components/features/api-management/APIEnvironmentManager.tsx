import React from 'react';
import { Settings, Plus } from 'lucide-react';

interface APIEnvironmentManagerProps {
  projectId: string;
}

export const APIEnvironmentManager: React.FC<APIEnvironmentManagerProps> = ({ projectId }) => {
  return (
    <div className="bg-bg-paper rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-text-primary">
          环境配置管理
        </h3>
      </div>
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-72 space-y-4">
          <Settings size={48} className="text-gray-400" />
          <p className="text-lg text-text-secondary">
            环境管理功能开发中
          </p>
          <p className="text-gray-500 text-center">
            将支持开发、测试、生产等多环境配置管理
          </p>
          <button 
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md font-medium opacity-50 cursor-not-allowed"
            disabled
          >
            <Plus size={16} className="mr-2" />
            添加环境
          </button>
        </div>
      </div>
    </div>
  );
};