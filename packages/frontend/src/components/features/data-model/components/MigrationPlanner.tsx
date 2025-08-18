import React, { useState, useEffect } from 'react'
import {
  ArrowRight,
  GitBranch,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  FileText,
  Download,
  Upload,
  Plus,
  Trash2,
  Eye,
  Settings,
  RotateCcw,
  RefreshCw,
  Code,
  Calendar,
  User,
  Target
} from 'lucide-react'
import { 
  generateMigrationScript, 
  generateMigrationPlan,
  generateRollbackScript
} from '../../../../utils/api'
import { toast } from 'react-hot-toast'

interface MigrationStep {
  id: string
  type: 'CREATE_TABLE' | 'ALTER_TABLE' | 'DROP_TABLE' | 'ADD_COLUMN' | 'DROP_COLUMN' | 'ADD_INDEX' | 'DROP_INDEX' | 'ADD_CONSTRAINT' | 'DROP_CONSTRAINT'
  description: string
  sql: string
  rollbackSql?: string
  dependencies: string[]
  estimatedTime: number // seconds
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  affectedTables: string[]
  warnings?: string[]
}

interface MigrationPlan {
  id: string
  name: string
  version: string
  description: string
  steps: MigrationStep[]
  totalEstimatedTime: number
  status: 'DRAFT' | 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  createdAt: Date
  createdBy: string
  targetDatabase: string
  rollbackPlan?: MigrationPlan
}

interface MigrationExecution {
  planId: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  currentStep: number
  totalSteps: number
  startTime?: Date
  endTime?: Date
  logs: Array<{
    timestamp: Date
    level: 'INFO' | 'WARN' | 'ERROR'
    message: string
    stepId?: string
  }>
  errors?: Array<{
    stepId: string
    error: string
    sqlState?: string
  }>
}

interface MigrationPlannerProps {
  projectId: string
  currentModel: any
  targetModel: any
  onMigrationCreate: (plan: MigrationPlan) => void
  onMigrationExecute: (planId: string) => void
}

const MigrationPlanner: React.FC<MigrationPlannerProps> = ({
  projectId,
  currentModel,
  targetModel,
  onMigrationCreate,
  onMigrationExecute
}) => {
  const [plans, setPlans] = useState<MigrationPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [execution, setExecution] = useState<MigrationExecution | null>(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [view, setView] = useState<'list' | 'designer' | 'execution'>('list')

  // 生成迁移计划
  const generatePlan = async (options: {
    name: string
    description: string
    dialect: string
    includeRollback: boolean
  }) => {
    setGenerating(true)
    
    try {
      // 生成主迁移脚本
      const migrationResponse = await generateMigrationScript({
        model: targetModel,
        dialect: options.dialect,
        oldModel: currentModel,
        options: {
          generateRollback: options.includeRollback,
          includeComments: true,
          safeMode: true
        }
      })

      if (migrationResponse.success) {
        const steps: MigrationStep[] = migrationResponse.data.steps?.map((step: any, index: number) => ({
          id: `step_${index}`,
          type: step.type || 'ALTER_TABLE',
          description: step.description || `迁移步骤 ${index + 1}`,
          sql: step.sql || '',
          rollbackSql: step.rollbackSql,
          dependencies: step.dependencies || [],
          estimatedTime: step.estimatedTime || 30,
          riskLevel: step.riskLevel || 'MEDIUM',
          affectedTables: step.affectedTables || [],
          warnings: step.warnings || []
        })) || []

        const newPlan: MigrationPlan = {
          id: `plan_${Date.now()}`,
          name: options.name,
          version: `v${Date.now()}`,
          description: options.description,
          steps,
          totalEstimatedTime: steps.reduce((total, step) => total + step.estimatedTime, 0),
          status: 'DRAFT',
          createdAt: new Date(),
          createdBy: '当前用户',
          targetDatabase: options.dialect
        }

        setPlans(prev => [...prev, newPlan])
        toast.success(`迁移计划 "${options.name}" 生成成功`)
        setShowPlanModal(false)
      } else {
        throw new Error(migrationResponse.message || '生成失败')
      }
    } catch (error) {
      console.error('Migration generation failed:', error)
      
      // 生成模拟迁移计划
      const mockPlan = generateMockMigrationPlan(options)
      setPlans(prev => [...prev, mockPlan])
      toast.success(`迁移计划 "${options.name}" 生成成功（模拟数据）`)
      setShowPlanModal(false)
    } finally {
      setGenerating(false)
    }
  }

  // 生成模拟迁移计划
  const generateMockMigrationPlan = (options: {
    name: string
    description: string
    dialect: string
  }): MigrationPlan => {
    const mockSteps: MigrationStep[] = [
      {
        id: 'step_1',
        type: 'CREATE_TABLE',
        description: '创建新用户表',
        sql: 'CREATE TABLE new_users (\n  id BIGINT PRIMARY KEY AUTO_INCREMENT,\n  username VARCHAR(50) NOT NULL,\n  email VARCHAR(100) NOT NULL\n);',
        rollbackSql: 'DROP TABLE new_users;',
        dependencies: [],
        estimatedTime: 45,
        riskLevel: 'LOW',
        affectedTables: ['new_users'],
        warnings: []
      },
      {
        id: 'step_2',
        type: 'ADD_COLUMN',
        description: '添加用户状态字段',
        sql: 'ALTER TABLE users ADD COLUMN status ENUM(\'active\', \'inactive\') DEFAULT \'active\';',
        rollbackSql: 'ALTER TABLE users DROP COLUMN status;',
        dependencies: [],
        estimatedTime: 60,
        riskLevel: 'MEDIUM',
        affectedTables: ['users'],
        warnings: ['此操作可能需要锁定表']
      },
      {
        id: 'step_3',
        type: 'ADD_INDEX',
        description: '添加邮箱唯一索引',
        sql: 'CREATE UNIQUE INDEX idx_users_email ON users(email);',
        rollbackSql: 'DROP INDEX idx_users_email ON users;',
        dependencies: ['step_2'],
        estimatedTime: 90,
        riskLevel: 'HIGH',
        affectedTables: ['users'],
        warnings: ['检查数据唯一性', '可能失败如果存在重复邮箱']
      }
    ]

    return {
      id: `plan_${Date.now()}`,
      name: options.name,
      version: `v${Date.now()}`,
      description: options.description,
      steps: mockSteps,
      totalEstimatedTime: mockSteps.reduce((total, step) => total + step.estimatedTime, 0),
      status: 'DRAFT',
      createdAt: new Date(),
      createdBy: '当前用户',
      targetDatabase: options.dialect
    }
  }

  // 执行迁移计划
  const executePlan = (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    if (!plan) return

    const newExecution: MigrationExecution = {
      planId,
      status: 'RUNNING',
      currentStep: 0,
      totalSteps: plan.steps.length,
      startTime: new Date(),
      logs: [
        {
          timestamp: new Date(),
          level: 'INFO',
          message: `开始执行迁移计划: ${plan.name}`
        }
      ]
    }

    setExecution(newExecution)
    setView('execution')

    // 模拟执行过程
    simulateExecution(newExecution, plan)
  }

  // 模拟迁移执行
  const simulateExecution = (exec: MigrationExecution, plan: MigrationPlan) => {
    let currentStep = 0
    
    const executeNextStep = () => {
      if (currentStep >= plan.steps.length) {
        // 执行完成
        setExecution(prev => prev ? {
          ...prev,
          status: 'COMPLETED',
          currentStep: plan.steps.length,
          endTime: new Date(),
          logs: [
            ...prev.logs,
            {
              timestamp: new Date(),
              level: 'INFO',
              message: '迁移计划执行完成'
            }
          ]
        } : null)
        
        setPlans(prev => prev.map(p => 
          p.id === plan.id ? { ...p, status: 'COMPLETED' } : p
        ))
        
        toast.success('迁移执行完成')
        return
      }

      const step = plan.steps[currentStep]
      
      setExecution(prev => prev ? {
        ...prev,
        currentStep: currentStep + 1,
        logs: [
          ...prev.logs,
          {
            timestamp: new Date(),
            level: 'INFO',
            message: `执行步骤 ${currentStep + 1}: ${step.description}`,
            stepId: step.id
          }
        ]
      } : null)

      // 模拟执行时间
      setTimeout(() => {
        // 随机成功/失败 (90% 成功率)
        const success = Math.random() > 0.1

        if (success) {
          setExecution(prev => prev ? {
            ...prev,
            logs: [
              ...prev.logs,
              {
                timestamp: new Date(),
                level: 'INFO',
                message: `步骤 ${currentStep + 1} 执行成功`,
                stepId: step.id
              }
            ]
          } : null)
          
          currentStep++
          setTimeout(executeNextStep, 1000)
        } else {
          // 模拟执行失败
          setExecution(prev => prev ? {
            ...prev,
            status: 'FAILED',
            logs: [
              ...prev.logs,
              {
                timestamp: new Date(),
                level: 'ERROR',
                message: `步骤 ${currentStep + 1} 执行失败: 模拟错误`,
                stepId: step.id
              }
            ],
            errors: [
              {
                stepId: step.id,
                error: '模拟的执行错误',
                sqlState: '23000'
              }
            ]
          } : null)
          
          setPlans(prev => prev.map(p => 
            p.id === plan.id ? { ...p, status: 'FAILED' } : p
          ))
          
          toast.error('迁移执行失败')
        }
      }, step.estimatedTime * 10) // 加速模拟
    }

    setTimeout(executeNextStep, 1000)
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'READY': return 'bg-blue-100 text-blue-800'
      case 'RUNNING': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取风险级别颜色
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600'
      case 'MEDIUM': return 'text-yellow-600'
      case 'HIGH': return 'text-red-600'
      default: return 'text-text-secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* 头部工具栏 */}
      <div className="bg-bg-paper rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-text-primary">数据库迁移规划器</h2>
              <p className="text-text-secondary">可视化设计和执行数据库迁移计划</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  view === 'list' ? 'bg-bg-paper text-text-primary shadow' : 'text-text-secondary'
                }`}
              >
                计划列表
              </button>
              <button
                onClick={() => setView('designer')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  view === 'designer' ? 'bg-bg-paper text-text-primary shadow' : 'text-text-secondary'
                }`}
              >
                可视化设计
              </button>
              <button
                onClick={() => setView('execution')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  view === 'execution' ? 'bg-bg-paper text-text-primary shadow' : 'text-text-secondary'
                }`}
                disabled={!execution}
              >
                执行监控
              </button>
            </div>
            
            <button
              onClick={() => setShowPlanModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>新建计划</span>
            </button>
          </div>
        </div>
      </div>

      {/* 计划列表视图 */}
      {view === 'list' && (
        <div className="bg-bg-paper rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-text-primary">
              迁移计划 ({plans.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    计划名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    版本
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    步骤数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    预估时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-bg-paper divide-y divide-gray-200">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-bg-secondary">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <GitBranch className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {plan.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {plan.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {plan.version}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {plan.steps.length}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-text-primary">
                        <Clock className="w-4 h-4 mr-1" />
                        {Math.round(plan.totalEstimatedTime / 60)}分钟
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                        {plan.status === 'DRAFT' && '草稿'}
                        {plan.status === 'READY' && '就绪'}
                        {plan.status === 'RUNNING' && '执行中'}
                        {plan.status === 'COMPLETED' && '已完成'}
                        {plan.status === 'FAILED' && '失败'}
                        {plan.status === 'CANCELLED' && '已取消'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.createdAt.toLocaleDateString()}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedPlan(plan.id)}
                          className="text-text-secondary hover:text-text-primary"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {plan.status === 'DRAFT' && (
                          <button
                            onClick={() => executePlan(plan.id)}
                            className="text-green-600 hover:text-green-900"
                            title="执行计划"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          className="text-red-600 hover:text-red-900"
                          title="删除计划"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {plans.length === 0 && (
            <div className="text-center py-12">
              <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                暂无迁移计划
              </h3>
              <p className="text-text-secondary mb-6">
                创建第一个迁移计划来开始数据库版本管理
              </p>
              <button
                onClick={() => setShowPlanModal(true)}
                className="btn-primary"
              >
                创建迁移计划
              </button>
            </div>
          )}
        </div>
      )}

      {/* 执行监控视图 */}
      {view === 'execution' && execution && (
        <div className="space-y-6">
          {/* 执行状态概览 */}
          <div className="bg-bg-paper rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-text-primary">
                  迁移执行监控
                </h3>
                <p className="text-text-secondary">
                  计划: {plans.find(p => p.id === execution.planId)?.name}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-text-secondary">进度</div>
                  <div className="text-lg font-medium">
                    {execution.currentStep} / {execution.totalSteps}
                  </div>
                </div>
                
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      execution.status === 'COMPLETED' ? 'bg-green-500' :
                      execution.status === 'FAILED' ? 'bg-red-500' : 'bg-primary-50 dark:bg-primary-900/20'
                    }`}
                    style={{ 
                      width: `${(execution.currentStep / execution.totalSteps) * 100}%` 
                    }}
                  />
                </div>
                
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(execution.status)}`}>
                  {execution.status === 'RUNNING' && '执行中'}
                  {execution.status === 'COMPLETED' && '已完成'}
                  {execution.status === 'FAILED' && '失败'}
                  {execution.status === 'CANCELLED' && '已取消'}
                </span>
              </div>
            </div>

            {/* 执行时间信息 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-text-secondary">开始时间</div>
                    <div className="font-medium">
                      {execution.startTime?.toLocaleString() || '-'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-text-secondary">已用时间</div>
                    <div className="font-medium">
                      {execution.startTime ? 
                        Math.round((Date.now() - execution.startTime.getTime()) / 1000) + 's' : 
                        '-'
                      }
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="flex items-center">
                  <Target className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-text-secondary">完成时间</div>
                    <div className="font-medium">
                      {execution.endTime?.toLocaleString() || '执行中...'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 执行日志 */}
          <div className="bg-bg-paper rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-text-primary">
                执行日志
              </h3>
              <button className="btn-outline flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>导出日志</span>
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {execution.logs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 text-sm font-mono"
                  >
                    <span className="text-gray-500 flex-shrink-0">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className={`flex-shrink-0 font-medium ${
                      log.level === 'ERROR' ? 'text-red-600' :
                      log.level === 'WARN' ? 'text-yellow-600' : 'text-text-secondary'
                    }`}>
                      [{log.level}]
                    </span>
                    <span className="text-text-primary">{log.message}</span>
                  </div>
                ))}
              </div>
              
              {execution.errors && execution.errors.length > 0 && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">执行错误</h4>
                  <div className="space-y-2">
                    {execution.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        <strong>步骤 {error.stepId}:</strong> {error.error}
                        {error.sqlState && (
                          <span className="ml-2 text-red-600">
                            (SQL状态: {error.sqlState})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 创建计划模态框 */}
      {showPlanModal && (
        <CreateMigrationPlanModal
          isOpen={true}
          onClose={() => setShowPlanModal(false)}
          onSave={generatePlan}
          loading={generating}
        />
      )}
    </div>
  )
}

// 创建迁移计划模态框
interface CreateMigrationPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (options: {
    name: string
    description: string
    dialect: string
    includeRollback: boolean
  }) => void
  loading: boolean
}

const CreateMigrationPlanModal: React.FC<CreateMigrationPlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  loading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dialect: 'mysql',
    includeRollback: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-text-primary">创建迁移计划</h2>
          <button onClick={onClose} className="btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              计划名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input w-full"
              placeholder="如: 用户表结构优化"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              计划描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input w-full"
              rows={3}
              placeholder="描述此次迁移的目的和主要变更..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              目标数据库
            </label>
            <select
              value={formData.dialect}
              onChange={(e) => setFormData(prev => ({ ...prev, dialect: e.target.value }))}
              className="input w-full"
            >
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="sqlite">SQLite</option>
              <option value="sqlserver">SQL Server</option>
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.includeRollback}
                onChange={(e) => setFormData(prev => ({ ...prev, includeRollback: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-text-primary">生成回滚脚本</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center space-x-2"
              disabled={loading}
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{loading ? '生成中...' : '生成计划'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MigrationPlanner