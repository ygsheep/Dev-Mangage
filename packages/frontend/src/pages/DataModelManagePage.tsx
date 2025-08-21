import { Database } from 'lucide-react'
import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DataModelPage from './DataModelPage'

const DataModelManagePage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* 数据模型内容 */}
      <div className="pt-0">
        {projectId ? (
          <DataModelPage projectIdFromQuery={projectId} />
        ) : (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Database className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">请选择项目</h3>
              <p className="text-text-secondary">请先从侧边栏选择一个项目来管理数据模型</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataModelManagePage
