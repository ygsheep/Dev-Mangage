import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Grid, List } from 'lucide-react'
import { Project, ProjectStatus } from '@shared/types'
import { apiMethods } from '../utils/api'
import ProjectCard from '../components/ProjectCard'
import CreateProjectModal from '../components/CreateProjectModal'
import DeleteProjectModal from '../components/DeleteProjectModal'
import { PROJECT_STATUS_LABELS } from '@shared/types'
import toast from 'react-hot-toast'

const ProjectsPage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Fetch projects
  const { data: projectsData, isLoading, error, refetch } = useQuery({
    queryKey: ['projects', search, statusFilter],
    queryFn: () => apiMethods.getProjects({ 
      search: search || undefined,
      status: statusFilter || undefined,
      limit: 50
    }),
  })

  const projects = projectsData?.data?.projects || []

  const handleEditProject = (project: Project) => {
    // TODO: Implement edit functionality
    console.log('Edit project:', project.id)
    toast.success('编辑功能将在未来版本中实现')
  }

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async (projectId: string) => {
    try {
      await apiMethods.deleteProject(projectId)
      toast.success('项目删除成功')
      refetch() // Refresh the project list
      setShowDeleteModal(false)
      setSelectedProject(null)
    } catch (error) {
      console.error('Delete project failed:', error)
      toast.error('删除项目失败，请重试')
      throw error // Re-throw to let modal handle loading state
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">项目管理</h1>
          <p className="text-gray-600">管理你的所有API项目</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>新建项目</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索项目..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
              className="input w-auto min-w-[120px]"
            >
              <option value="">所有状态</option>
              {Object.entries(PROJECT_STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-primary-100 text-primary-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-primary-100 text-primary-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card text-center py-12">
            <p className="text-red-600 mb-4">加载项目失败</p>
            <button onClick={() => refetch()} className="btn-primary">
              重试
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              还没有项目
            </h3>
            <p className="text-gray-600 mb-6">
              创建你的第一个项目开始管理API
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              创建项目
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: Project) => (
              <div key={project.id} className="relative">
                <Link to={`/projects/${project.id}`} className="block">
                  <ProjectCard 
                    project={project} 
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                  />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      项目名称
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      描述
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      API数量
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      状态
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      更新时间
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project: Project) => (
                    <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          to={`/projects/${project.id}`}
                          className="font-medium text-primary-600 hover:text-primary-800"
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {project.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {project._count?.apis || 0}
                      </td>
                      <td className="py-3 px-4">
                        <span className="status-badge bg-green-100 text-green-800">
                          {PROJECT_STATUS_LABELS[project.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleEditProject(project)
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            编辑
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleDeleteProject(project)
                            }}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            refetch()
          }}
        />
      )}

      {/* Delete Project Modal */}
      <DeleteProjectModal
        project={selectedProject}
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedProject(null)
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default ProjectsPage