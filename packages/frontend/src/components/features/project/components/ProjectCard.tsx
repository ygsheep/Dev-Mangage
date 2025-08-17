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
          <h3 className="text-lg font-semibold text-text-primary truncate group-hover:text-primary-600 transition-colors">
            {project.name}
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 mt-2">
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleMenuClick}
            className="p-1 hover:bg-bg-tertiary rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-text-tertiary" />
          </button>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-8 w-48 bg-bg-paper rounded-lg shadow-theme-lg border border-border-primary z-50">
              <div className="py-1">
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary transition-colors"
                  >
                    <Edit3 className="w-4 h-4 mr-3 text-text-tertiary" />
                    编辑项目
                  </button>
                )}
                
                <button
                  onClick={handleArchive}
                  className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary transition-colors"
                >
                  <Archive className="w-4 h-4 mr-3 text-text-tertiary" />
                  归档项目
                </button>
                
                <div className="border-t border-border-secondary my-1"></div>
                
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center w-full px-4 py-2 text-sm text-status-error hover:bg-status-error hover:bg-opacity-10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-3 text-status-error" />
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
        <p className="text-text-secondary text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-primary-500" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              {project._count?.apis || 0}
            </p>
            <p className="text-xs text-text-secondary">APIs</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-status-success" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              {project._count?.tags || 0}
            </p>
            <p className="text-xs text-text-secondary">标签</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-tertiary pt-4 border-t border-border-primary">
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