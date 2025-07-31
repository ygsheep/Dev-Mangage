import toast from 'react-hot-toast'

/**
 * 剪贴板工具类
 */
export class ClipboardUtils {
  /**
   * 复制文本到剪贴板
   * @param text 要复制的文本
   * @param successMessage 成功消息
   * @returns 是否成功
   */
  static async copyText(text: string, successMessage = '已复制到剪贴板'): Promise<boolean> {
    try {
      // 优先使用现代API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'absolute'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (!successful) {
          throw new Error('复制命令执行失败')
        }
      }
      
      // 显示成功消息
      toast.success(successMessage)
      return true
    } catch (error) {
      console.error('复制失败:', error)
      toast.error('复制失败')
      return false
    }
  }

  /**
   * 复制JSON对象到剪贴板
   * @param data JSON对象
   * @param label 标签名称
   * @returns 是否成功
   */
  static async copyJson(data: any, label = 'JSON'): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(data, null, 2)
      return await this.copyText(jsonString, `${label}已复制到剪贴板`)
    } catch (error) {
      console.error('JSON序列化失败:', error)
      toast.error('数据格式错误，无法复制')
      return false
    }
  }

  /**
   * 生成并复制cURL命令
   * @param api API对象
   * @returns 是否成功
   */
  static async copyCurlCommand(api: any): Promise<boolean> {
    try {
      const curlCommand = this.formatCurlCommand(api)
      if (!curlCommand) {
        toast.error('该API不支持生成cURL命令')
        return false
      }
      return await this.copyText(curlCommand, 'cURL命令已复制到剪贴板')
    } catch (error) {
      console.error('生成cURL命令失败:', error)
      toast.error('生成cURL命令失败')
      return false
    }
  }

  /**
   * 格式化cURL命令
   * @param api API对象
   * @returns cURL命令字符串
   */
  static formatCurlCommand(api: any): string {
    if (!api.method || !api.path) return ''
    
    const { method, path } = api
    let curl = `curl -X ${method}`
    
    // 添加URL
    curl += ` "${path}"`
    
    // 添加请求头
    if (method !== 'GET') {
      curl += ` \\\n  -H "Content-Type: application/json"`
      curl += ` \\\n  -H "Accept: application/json"`
    }
    
    // 添加请求体示例
    if (method !== 'GET') {
      const requestBody = {
        "example": "data"
      }
      const jsonBody = JSON.stringify(requestBody, null, 2)
        .split('\n')
        .map(line => '    ' + line)
        .join('\n')
      curl += ` \\\n  -d '\n${jsonBody}\n  '`
    }
    
    return curl
  }

  /**
   * 复制API端点
   * @param endpoint API端点
   * @returns 是否成功
   */
  static async copyEndpoint(endpoint: string): Promise<boolean> {
    return await this.copyText(endpoint, 'API端点已复制到剪贴板')
  }

  /**
   * 复制代码示例
   * @param api API对象
   * @param language 编程语言 (javascript|python|curl)
   * @returns 是否成功
   */
  static async copyCodeExample(api: any, language = 'javascript'): Promise<boolean> {
    try {
      let code = ''
      
      switch (language) {
        case 'javascript':
          code = this.generateJavaScriptCode(api)
          break
        case 'python':
          code = this.generatePythonCode(api)
          break
        case 'curl':
          code = this.formatCurlCommand(api)
          break
        default:
          toast.error('不支持的编程语言')
          return false
      }
      
      if (!code) {
        toast.error('无法生成代码示例')
        return false
      }
      
      return await this.copyText(code, `${language}代码已复制到剪贴板`)
    } catch (error) {
      console.error('生成代码示例失败:', error)
      toast.error('生成代码示例失败')
      return false
    }
  }

  /**
   * 生成JavaScript代码
   * @param api API对象
   * @returns JavaScript代码
   */
  static generateJavaScriptCode(api: any): string {
    if (!api.method || !api.path) return ''
    
    const { method, path, name, description } = api
    
    let code = `// ${name}\n`
    code += `// ${description}\n\n`
    
    if (method === 'GET') {
      code += `fetch('${path}')\n`
      code += `  .then(response => response.json())\n`
      code += `  .then(data => {\n`
      code += `    console.log('Success:', data);\n`
      code += `  })\n`
      code += `  .catch(error => {\n`
      code += `    console.error('Error:', error);\n`
      code += `  });`
    } else {
      code += `fetch('${path}', {\n`
      code += `  method: '${method}',\n`
      code += `  headers: {\n`
      code += `    'Content-Type': 'application/json',\n`
      code += `  },\n`
      code += `  body: JSON.stringify({\n`
      code += `    // Add your request data here\n`
      code += `  })\n`
      code += `})\n`
      code += `.then(response => response.json())\n`
      code += `.then(data => {\n`
      code += `  console.log('Success:', data);\n`
      code += `})\n`
      code += `.catch(error => {\n`
      code += `  console.error('Error:', error);\n`
      code += `});`
    }
    
    return code
  }

  /**
   * 生成Python代码
   * @param api API对象
   * @returns Python代码
   */
  static generatePythonCode(api: any): string {
    if (!api.method || !api.path) return ''
    
    const { method, path, name, description } = api
    
    let code = `# ${name}\n`
    code += `# ${description}\n\n`
    code += `import requests\nimport json\n\n`
    
    if (method === 'GET') {
      code += `response = requests.get('${path}')\n\n`
    } else {
      code += `url = '${path}'\n`
      code += `headers = {\n`
      code += `    'Content-Type': 'application/json'\n`
      code += `}\n\n`
      code += `data = {\n`
      code += `    # Add your request data here\n`
      code += `}\n\n`
      code += `response = requests.${method.toLowerCase()}(url, headers=headers, json=data)\n\n`
    }
    
    code += `if response.status_code == 200:\n`
    code += `    result = response.json()\n`
    code += `    print('Success:', result)\n`
    code += `else:\n`
    code += `    print('Error:', response.status_code, response.text)`
    
    return code
  }
}