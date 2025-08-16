import { ParsedModel, ValidationResult } from '../types'
import { ModelValidator, ValidationOptions } from './ModelValidator'
import { ModelCorrector, CorrectionOptions, CorrectionResult } from './ModelCorrector'
import logger from '../../../utils/logger'

export interface ValidationAndCorrectionOptions extends ValidationOptions, CorrectionOptions {
  enableAutoCorrection?: boolean
  correctionMode?: 'conservative' | 'aggressive' | 'custom'
}

export interface ValidationAndCorrectionResult {
  originalValidation: ValidationResult
  correctionResult?: CorrectionResult
  finalValidation?: ValidationResult
  recommendations: string[]
  summary: {
    originalScore: number
    finalScore?: number
    improvement?: number
    totalIssuesFixed: number
  }
}

export class ModelValidationService {
  /**
   * 验证并修正数据模型
   */
  static async validateAndCorrect(
    model: ParsedModel,
    options: ValidationAndCorrectionOptions = {}
  ): Promise<ValidationAndCorrectionResult> {
    logger.info('开始模型验证和修正', {
      modelName: model.name,
      enableAutoCorrection: options.enableAutoCorrection,
      correctionMode: options.correctionMode
    })

    // 第一次验证
    const originalValidation = ModelValidator.validate(model, options)
    
    let correctionResult: CorrectionResult | undefined
    let finalValidation: ValidationResult | undefined
    let finalModel = model

    // 如果启用自动修正且有可修正的问题
    if (options.enableAutoCorrection && this.hasFixableIssues(originalValidation)) {
      const correctionOptions = this.buildCorrectionOptions(options)
      
      correctionResult = await ModelCorrector.correctModel(
        model,
        originalValidation,
        correctionOptions
      )

      if (correctionResult.success) {
        finalModel = correctionResult.correctedModel
        
        // 对修正后的模型进行再次验证
        finalValidation = ModelValidator.validate(finalModel, options)
      }
    }

    // 生成建议
    const recommendations = this.generateRecommendations(
      originalValidation,
      correctionResult,
      finalValidation,
      options
    )

    // 计算改进情况
    const improvement = finalValidation 
      ? finalValidation.score - originalValidation.score 
      : 0

    const result: ValidationAndCorrectionResult = {
      originalValidation,
      correctionResult,
      finalValidation,
      recommendations,
      summary: {
        originalScore: originalValidation.score,
        finalScore: finalValidation?.score,
        improvement,
        totalIssuesFixed: correctionResult?.appliedFixes.length || 0
      }
    }

    logger.info('模型验证和修正完成', {
      modelName: model.name,
      originalScore: originalValidation.score,
      finalScore: finalValidation?.score,
      improvement,
      issuesFixed: correctionResult?.appliedFixes.length || 0
    })

    return result
  }

  /**
   * 快速验证（仅验证，不修正）
   */
  static quickValidate(model: ParsedModel, options: ValidationOptions = {}): ValidationResult {
    return ModelValidator.validate(model, {
      strictMode: false,
      checkNaming: true,
      checkTypes: true,
      checkRelationships: true,
      checkConstraints: true,
      ...options
    })
  }

  /**
   * 严格验证（完整检查）
   */
  static strictValidate(model: ParsedModel, options: ValidationOptions = {}): ValidationResult {
    return ModelValidator.validate(model, {
      strictMode: true,
      checkNaming: true,
      checkTypes: true,
      checkRelationships: true,
      checkConstraints: true,
      ...options
    })
  }

  /**
   * 智能修正（自动选择最佳修正策略）
   */
  static async smartCorrect(
    model: ParsedModel,
    options: ValidationAndCorrectionOptions = {}
  ): Promise<ValidationAndCorrectionResult> {
    // 先进行快速验证
    const quickValidation = this.quickValidate(model, options)
    
    // 根据验证结果决定修正策略
    let correctionMode: 'conservative' | 'aggressive' | 'custom' = 'conservative'
    
    if (quickValidation.score < 50) {
      correctionMode = 'aggressive'
    } else if (quickValidation.score < 80) {
      correctionMode = 'conservative'
    }

    return this.validateAndCorrect(model, {
      ...options,
      enableAutoCorrection: true,
      correctionMode
    })
  }

  /**
   * 生成模型质量报告
   */
  static generateQualityReport(
    model: ParsedModel,
    validationResult: ValidationResult
  ): string {
    const report = []
    
    report.push(`# 数据模型质量报告`)
    report.push(``)
    report.push(`**模型名称**: ${model.name}`)
    report.push(`**验证时间**: ${new Date().toLocaleString()}`)
    report.push(`**质量评分**: ${validationResult.score}/100`)
    report.push(``)
    
    // 概览统计
    report.push(`## 概览统计`)
    report.push(`- 表数量: ${model.tables.length}`)
    report.push(`- 字段总数: ${model.tables.reduce((sum, t) => sum + t.fields.length, 0)}`)
    report.push(`- 错误数量: ${validationResult.summary.errorCount}`)
    report.push(`- 警告数量: ${validationResult.summary.warningCount}`)
    report.push(`- 信息提示: ${validationResult.summary.infoCount}`)
    report.push(``)

    // 问题详情
    if (validationResult.issues.length > 0) {
      report.push(`## 问题详情`)
      
      // 按严重程度分组
      const groupedIssues = this.groupIssuesBySeverity(validationResult.issues)
      
      for (const [severity, issues] of Object.entries(groupedIssues)) {
        if (issues.length > 0) {
          report.push(`### ${this.getSeverityDisplayName(severity)}`)
          
          for (const issue of issues) {
            report.push(`- **${issue.target.table || 'Global'}**: ${issue.message}`)
            if (issue.suggestion) {
              report.push(`  - 建议: ${issue.suggestion}`)
            }
          }
          report.push(``)
        }
      }
    }

    // 改进建议
    if (validationResult.suggestions.length > 0) {
      report.push(`## 改进建议`)
      for (const suggestion of validationResult.suggestions) {
        report.push(`- ${suggestion}`)
      }
      report.push(``)
    }

    // 表详情
    report.push(`## 表详情`)
    for (const table of model.tables) {
      report.push(`### ${table.name}`)
      report.push(`- 字段数量: ${table.fields.length}`)
      report.push(`- 主键字段: ${table.fields.filter(f => f.isPrimaryKey).map(f => f.name).join(', ') || '无'}`)
      report.push(`- 外键字段: ${table.fields.filter(f => f.referencedTable).map(f => f.name).join(', ') || '无'}`)
      report.push(``)
    }

    return report.join('\n')
  }

  // 私有辅助方法
  private static hasFixableIssues(validation: ValidationResult): boolean {
    return validation.issues.some(issue => (issue as any).autoFixable)
  }

  private static buildCorrectionOptions(options: ValidationAndCorrectionOptions): CorrectionOptions {
    const mode = options.correctionMode || 'conservative'
    
    const baseOptions: CorrectionOptions = {
      targetDialect: options.targetDialect,
      preserveOriginalNames: options.preserveOriginalNames
    }

    switch (mode) {
      case 'aggressive':
        return {
          ...baseOptions,
          autoFixNaming: true,
          autoAddPrimaryKeys: true,
          autoFixTypes: true,
          autoOptimizeIndexes: true
        }
      
      case 'conservative':
        return {
          ...baseOptions,
          autoFixNaming: false,
          autoAddPrimaryKeys: true,
          autoFixTypes: true,
          autoOptimizeIndexes: false
        }
      
      case 'custom':
        return {
          ...baseOptions,
          autoFixNaming: options.autoFixNaming,
          autoAddPrimaryKeys: options.autoAddPrimaryKeys,
          autoFixTypes: options.autoFixTypes,
          autoOptimizeIndexes: options.autoOptimizeIndexes
        }
      
      default:
        return baseOptions
    }
  }

  private static generateRecommendations(
    originalValidation: ValidationResult,
    correctionResult?: CorrectionResult,
    finalValidation?: ValidationResult,
    options?: ValidationAndCorrectionOptions
  ): string[] {
    const recommendations: string[] = []

    // 基于原始验证结果的建议
    if (originalValidation.score < 60) {
      recommendations.push('模型质量较低，建议进行全面优化')
    } else if (originalValidation.score < 80) {
      recommendations.push('模型质量中等，有改进空间')
    } else {
      recommendations.push('模型质量良好，可进行微调优化')
    }

    // 基于修正结果的建议
    if (correctionResult) {
      if (correctionResult.appliedFixes.length > 0) {
        recommendations.push(`已自动修复 ${correctionResult.appliedFixes.length} 个问题`)
      }
      
      if (correctionResult.remainingIssues.length > 0) {
        recommendations.push(`还有 ${correctionResult.remainingIssues.length} 个问题需要手动处理`)
      }
    }

    // 基于最终验证结果的建议
    if (finalValidation && originalValidation) {
      const improvement = finalValidation.score - originalValidation.score
      if (improvement > 10) {
        recommendations.push(`质量评分提升了 ${improvement} 分，改进效果显著`)
      } else if (improvement > 0) {
        recommendations.push(`质量评分提升了 ${improvement} 分`)
      }
    }

    // 基于错误类型的具体建议
    const errorTypes = new Set(originalValidation.issues.map(i => (i as any).rule))
    
    if (errorTypes.has('primary_key_required')) {
      recommendations.push('建议为所有表添加主键以确保数据唯一性')
    }
    
    if (errorTypes.has('foreign_key_integrity')) {
      recommendations.push('检查外键关系的完整性，确保引用的表和字段存在')
    }
    
    if (errorTypes.has('table_naming_convention')) {
      recommendations.push('统一表命名规范，使用小写字母和下划线')
    }
    
    if (errorTypes.has('field_types_valid')) {
      recommendations.push('检查字段类型定义，确保符合目标数据库规范')
    }

    return recommendations
  }

  private static groupIssuesBySeverity(issues: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {
      'ERROR': [],
      'WARNING': [],
      'INFO': []
    }

    for (const issue of issues) {
      const severity = issue.severity || 'INFO'
      if (!grouped[severity]) {
        grouped[severity] = []
      }
      grouped[severity].push(issue)
    }

    return grouped
  }

  private static getSeverityDisplayName(severity: string): string {
    const names: Record<string, string> = {
      'ERROR': '错误',
      'WARNING': '警告',
      'INFO': '信息'
    }
    return names[severity] || severity
  }
}

// 导出所有验证相关的类和接口
export { ModelValidator, ValidationOptions } from './ModelValidator'
export { ModelCorrector, CorrectionOptions, CorrectionResult } from './ModelCorrector'
export * from './ModelValidator'