#!/usr/bin/env python3
"""
滚动条样式批量替换脚本
自动为所有 overflow 相关的元素添加合适的滚动条样式类
"""

import os
import re
import glob
from pathlib import Path

# 替换规则配置
REPLACEMENT_RULES = [
    # 基础滚动容器替换
    {
        'pattern': r'className="([^"]*?)overflow-y-auto([^"]*?)"',
        'replacement': r'className="\1overflow-y-auto custom-scrollbar\2"',
        'description': '垂直滚动容器添加自定义滚动条',
        'condition': lambda match: 'custom-scrollbar' not in match.group(0) and 'scrollbar-thin' not in match.group(0) and 'scrollbar-contrast' not in match.group(0)
    },
    {
        'pattern': r'className="([^"]*?)overflow-auto([^"]*?)"',
        'replacement': r'className="\1overflow-auto custom-scrollbar\2"',
        'description': '双向滚动容器添加自定义滚动条',
        'condition': lambda match: 'custom-scrollbar' not in match.group(0) and 'scrollbar-thin' not in match.group(0) and 'scrollbar-contrast' not in match.group(0)
    },
    {
        'pattern': r'className="([^"]*?)overflow-x-auto([^"]*?)"',
        'replacement': r'className="\1overflow-x-auto custom-scrollbar\2"',
        'description': '水平滚动容器添加自定义滚动条',
        'condition': lambda match: 'custom-scrollbar' not in match.group(0) and 'scrollbar-thin' not in match.group(0) and 'scrollbar-contrast' not in match.group(0)
    }
]

# 特殊上下文处理规则
CONTEXT_RULES = [
    {
        'pattern': r'max-h-\d+.*?overflow-(?:y-)?auto',
        'scrollbar_class': 'scrollbar-thin',
        'description': '限高容器使用细滚动条'
    },
    {
        'pattern': r'font-mono(?:-nerd)?.*?overflow-(?:auto|y-auto)',
        'scrollbar_class': 'scrollbar-contrast',
        'description': '代码容器使用高对比度滚动条'
    },
    {
        'pattern': r'(?:debug|console|log).*?overflow-(?:auto|y-auto)',
        'scrollbar_class': 'scrollbar-contrast',
        'description': '调试面板使用高对比度滚动条'
    },
    {
        'pattern': r'(?:modal|dialog|popup).*?overflow-(?:auto|y-auto)',
        'scrollbar_class': 'custom-scrollbar',
        'description': '模态框使用标准滚动条'
    }
]

def find_tsx_files(root_dir):
    """查找所有需要处理的 TypeScript/React 文件"""
    patterns = [
        'packages/frontend/src/**/*.tsx',
        'packages/frontend/src/**/*.jsx', 
        'packages/frontend/src/**/*.ts'
    ]
    
    files = []
    for pattern in patterns:
        files.extend(glob.glob(os.path.join(root_dir, pattern), recursive=True))
    
    return list(set(files))  # 去重

def determine_scrollbar_class(line_content):
    """根据上下文确定使用哪种滚动条样式"""
    line_lower = line_content.lower()
    
    # 检查特殊上下文
    for rule in CONTEXT_RULES:
        if re.search(rule['pattern'], line_content, re.IGNORECASE):
            return rule['scrollbar_class']
    
    # 默认返回标准滚动条
    return 'custom-scrollbar'

def process_file_content(content, file_path):
    """处理文件内容，应用滚动条样式"""
    lines = content.split('\n')
    changes = []
    change_count = 0
    
    for i, line in enumerate(lines):
        if 'overflow' in line and 'className=' in line:
            # 检查是否已经有滚动条样式
            if any(cls in line for cls in ['custom-scrollbar', 'scrollbar-thin', 'scrollbar-contrast', 'scrollbar-hide']):
                continue
            
            # 查找 overflow 相关的类
            overflow_patterns = [
                (r'overflow-y-auto(?!\s+(?:custom-scrollbar|scrollbar-thin|scrollbar-contrast))', 'overflow-y-auto'),
                (r'overflow-auto(?!\s+(?:custom-scrollbar|scrollbar-thin|scrollbar-contrast))', 'overflow-auto'),
                (r'overflow-x-auto(?!\s+(?:custom-scrollbar|scrollbar-thin|scrollbar-contrast))', 'overflow-x-auto')
            ]
            
            for pattern, overflow_class in overflow_patterns:
                if re.search(pattern, line):
                    # 确定使用哪种滚动条样式
                    scrollbar_class = determine_scrollbar_class(line)
                    
                    # 执行替换
                    new_line = re.sub(pattern, f'{overflow_class} {scrollbar_class}', line)
                    if new_line != line:
                        lines[i] = new_line
                        change_count += 1
                        changes.append({
                            'line': i + 1,
                            'old': line.strip(),
                            'new': new_line.strip(),
                            'type': f'添加 {scrollbar_class}'
                        })
                        break
    
    return '\n'.join(lines), change_count, changes

def process_file(file_path):
    """处理单个文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content, change_count, changes = process_file_content(content, file_path)
        
        if change_count > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            rel_path = os.path.relpath(file_path)
            print(f"✅ {rel_path}: {change_count} 处修改")
            
            for change in changes[:3]:  # 只显示前3个修改
                print(f"   第{change['line']}行: {change['type']}")
            
            if len(changes) > 3:
                print(f"   ... 还有 {len(changes) - 3} 处修改")
            
            return change_count
        else:
            print(f"⏭️  {os.path.relpath(file_path)}: 无需修改")
            return 0
            
    except Exception as e:
        print(f"❌ 处理文件 {file_path} 时出错: {e}")
        return 0

def main():
    """主函数"""
    print("🚀 开始批量替换滚动条样式...\n")
    
    # 获取项目根目录
    root_dir = Path(__file__).parent.parent
    
    # 查找需要处理的文件
    files = find_tsx_files(str(root_dir))
    print(f"📁 找到 {len(files)} 个文件需要处理\n")
    
    total_changes = 0
    processed_files = 0
    
    # 处理每个文件
    for file_path in files:
        changes = process_file(file_path)
        total_changes += changes
        if changes > 0:
            processed_files += 1
    
    # 打印统计结果
    print(f"\n📊 处理完成统计:")
    print(f"   总文件数: {len(files)}")
    print(f"   修改文件数: {processed_files}")  
    print(f"   总修改数: {total_changes}")
    
    if total_changes > 0:
        print("\n✨ 滚动条样式替换完成！")
        print("\n📝 使用的滚动条样式类:")
        print("   - custom-scrollbar: 标准滚动条（8px，适合主要内容区域）")
        print("   - scrollbar-thin: 细滚动条（6px，适合小型区域）") 
        print("   - scrollbar-contrast: 高对比度滚动条（10px，适合代码区域）")
        print("   - scrollbar-hide: 隐藏滚动条（保持滚动功能）")
    else:
        print("\n💡 所有文件的滚动条样式都已是最新的！")

if __name__ == "__main__":
    main()