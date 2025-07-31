/**
 * 防抖函数 - 延迟执行函数调用
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * 节流函数 - 限制函数调用频率
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      func(...args)
      lastCall = now
    }
  }
}

/**
 * 生成UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
  const d = new Date(date)
  
  if (format === 'time') {
    return d.toLocaleTimeString('zh-CN', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return d.toLocaleDateString('zh-CN')
}

/**
 * 计算相对时间
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay < 7) return `${diffDay}天前`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}周前`
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}个月前`
  return `${Math.floor(diffDay / 365)}年前`
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  return obj
}

/**
 * 合并CSS类名
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * 截断文本
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * 验证URL格式
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 从对象中提取指定字段
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

/**
 * 从对象中排除指定字段
 */
export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => {
    delete result[key]
  })
  return result
}

/**
 * 数组分组
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = key(item)
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item)
      return groups
    },
    {} as Record<K, T[]>
  )
}

/**
 * 数组去重
 */
export function unique<T>(array: T[], key?: (item: T) => any): T[] {
  if (!key) {
    return Array.from(new Set(array))
  }
  
  const seen = new Set()
  return array.filter(item => {
    const k = key(item)
    if (seen.has(k)) {
      return false
    }
    seen.add(k)
    return true
  })
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * 安全的JSON字符串化
 */
export function safeJsonStringify(obj: any, fallback = '{}'): string {
  try {
    return JSON.stringify(obj)
  } catch {
    return fallback
  }
}