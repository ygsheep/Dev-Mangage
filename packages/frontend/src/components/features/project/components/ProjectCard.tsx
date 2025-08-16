import React, { useState, useRef, useEffect } from 'react'
import { Calendar, Code2, Tag, MoreVertical, Edit3, Trash2, Archive } from 'lucide-react'
import { Project, PROJECT_STATUS_LABELS } from '@shared/types'

interface ProjectCardProps {
  project: Project
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDropdown(!showDropdown)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDropdown(false)
    onEdit?.(project)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDropdown(false)
    onDelete?.(project)
  }

  const handleArchive = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDropdown(false)
    // TODO: 实现归档功能
    console.log('Archive project:', project.id)
  }

  return (
    <div className="card hover:shadow-md transition-shadow duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
            {project.name}
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleMenuClick}
            className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="py-1">
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Edit3 className="w-4 h-4 mr-3 text-gray-500" />
                    编辑项目
                  </button>
                )}
                
                <button
                  onClick={handleArchive}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Archive className="w-4 h-4 mr-3 text-gray-500" />
                  归档项目
                </button>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-3 text-red-500" />
                    删除项目
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {project._count?.apis || 0}
            </p>
            <p className="text-xs text-gray-600">APIs</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {project._count?.tags || 0}
            </p>
            <p className="text-xs text-gray-600">标签</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>
            {new Date(project.updatedAt).toLocaleDateString('zh-CN', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Tags preview */}
          {project.tags && project.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: tag.color }}
              title={tag.name}
            />
          ))}
          {project.tags && project.tags.length > 3 && (
            <span className="text-gray-400">+{project.tags.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectCard