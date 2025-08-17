import React from 'react';
import { Play, Plus } from 'lucide-react';

interface APITestRunnerProps {
  projectId: string;
  endpoints: any[];
  groups: any[];
}

export const APITestRunner: React.FC<APITestRunnerProps> = ({ 
  projectId, 
  endpoints, 
  groups 
}) => {
  return (
    <div className="bg-bg-paper rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-text-primary">
          接口测试运行器
        </h3>
      </div>
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-72 space-y-4">
          <Play size={48} className="text-gray-400" />
          <p className="text-lg text-text-secondary">
            测试运行器功能开发中
          </p>
          <p className="text-gray-500 text-center">
            将支持自动化测试、断言验证、测试报告等功能
          </p>
          <button 
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md font-medium opacity-50 cursor-not-allowed"
            disabled
          >
            <Plus size={16} className="mr-2" />
            创建测试
          </button>
        </div>
      </div>
    </div>
  );
};