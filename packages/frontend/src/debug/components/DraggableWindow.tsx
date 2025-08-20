import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { DebugPanelProps } from '../types'

interface DraggableWindowProps extends DebugPanelProps {
  title: string
  children: ReactNode
  className?: string
  minWidth?: number
  minHeight?: number
  defaultWidth?: number
  defaultHeight?: number
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({
  title,
  children,
  className = '',
  position = { x: 50, y: 50 },
  onPositionChange,
  onClose,
  minWidth = 400,
  minHeight = 300,
  defaultWidth = 800,
  defaultHeight = 600,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight })
  const [isMinimized, setIsMinimized] = useState(false)

  const windowRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === headerRef.current || headerRef.current?.contains(e.target as Node)) {
      setIsDragging(true)
      const rect = windowRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }
  }

  // 处理调整大小开始
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
  }

  // 处理鼠标移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y)),
        }
        onPositionChange?.(newPosition)
      }

      if (isResizing) {
        const rect = windowRef.current?.getBoundingClientRect()
        if (rect) {
          const newSize = {
            width: Math.max(minWidth, e.clientX - rect.left),
            height: Math.max(minHeight, e.clientY - rect.top),
          }
          setSize(newSize)
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, dragOffset, onPositionChange, minWidth, minHeight])

  // 防止选择文本
  useEffect(() => {
    if (isDragging || isResizing) {
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.userSelect = ''
    }

    return () => {
      document.body.style.userSelect = ''
    }
  }, [isDragging, isResizing])

  return (
    <div
      ref={windowRef}
      className={`fixed bg-bg-paper border border-gray-300 bg-bg-secondary focus:outline-none shadow-lg rounded-lg overflow-hidden z-50 ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: isMinimized ? 'auto' : size.height,
        maxWidth: '90vw',
        maxHeight: '90vh',
      }}
    >
      {/* 窗口标题栏 */}
      <div
        ref={headerRef}
        className={`bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between cursor-move select-none ${
          isDragging ? 'bg-gray-200' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 bg-red-500 rounded-full cursor-pointer hover:bg-red-600"
            onClick={onClose}
          />
          <div
            className="w-3 h-3 bg-yellow-500 rounded-full cursor-pointer hover:bg-yellow-600"
            onClick={() => setIsMinimized(!isMinimized)}
          />
          <div className="w-3 h-3 bg-green-500 rounded-full" />
        </div>

        <h3 className="text-sm font-medium text-gray-800 flex-1 text-center">{title}</h3>

        <div className="flex items-center space-x-2">
          <button
            className="text-gray-500 hover:text-text-primary text-xs"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button className="text-gray-500 hover:text-text-primary text-xs" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      {/* 窗口内容 */}
      {!isMinimized && (
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-hidden">{children}</div>

          {/* 调整大小手柄 */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize"
            onMouseDown={handleResizeMouseDown}
          >
            <div className="absolute bottom-1 right-1 w-0 h-0 border-l-2 border-b-2 border-gray-400 transform rotate-45" />
            <div className="absolute bottom-0.5 right-0.5 w-0 h-0 border-l-1 border-b-1 border-gray-300 bg-bg-secondary transform rotate-45" />
          </div>
        </div>
      )}
    </div>
  )
}

export default DraggableWindow
